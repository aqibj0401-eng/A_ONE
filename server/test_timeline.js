require('dotenv').config();
const mongoose = require('mongoose');
const BehaviorEvent = require('./models/BehaviorEvent');
const Feedback = require('./models/Feedback');

const processTimeline = (rawTimeline) => {
    if (!rawTimeline) return [];
    
    // 1. Filter out feedback_submitted behaviors to avoid duplicates
    let filtered = rawTimeline.filter(item => 
      !(item.type === 'behavior' && item.eventType === 'feedback_submitted')
    );

    // 2. Collapse repetitive views
    let collapsed = [];
    for (let i = 0; i < filtered.length; i++) {
      let current = { ...filtered[i] };
      if (current.type === 'behavior' && (current.eventType === 'page_view' || current.eventType === 'product_view')) {
        let count = 1;
        let totalDuration = current.duration || 0;
        let j = i + 1;
        
        while (j < filtered.length) {
          const next = filtered[j];
          if (next.type !== 'behavior' || next.eventType !== current.eventType) break;
          
          const currentIdentifier = current.eventType === 'page_view' ? current.metadata?.path : current.metadata?.productName;
          const nextIdentifier = next.eventType === 'page_view' ? next.metadata?.path : next.metadata?.productName;
          
          if (currentIdentifier !== nextIdentifier) break;
          
          const timeGap = new Date(next.timestamp) - new Date(filtered[j-1].timestamp);
          if (timeGap > 5 * 60 * 1000) break; // 5 minutes max gap to merge

          count++;
          totalDuration += (next.duration || 0);
          j++;
        }
        
        if (count > 1) {
          current.count = count;
          current.duration = totalDuration;
          i = j - 1; 
        }
      }
      collapsed.push(current);
    }

    // 3. Group by session (20 min gap)
    let sessions = [];
    let currentSession = null;

    collapsed.forEach((item) => {
      if (!currentSession) {
        currentSession = { events: [item], startTime: item.timestamp, summary: {} };
      } else {
        const lastEvent = currentSession.events[currentSession.events.length - 1];
        const gap = new Date(item.timestamp) - new Date(lastEvent.timestamp);
        
        if (gap > 20 * 60 * 1000) { 
          sessions.push(currentSession);
          currentSession = { events: [item], startTime: item.timestamp, summary: {} };
        } else {
          currentSession.events.push(item);
        }
      }
    });

    if (currentSession) {
      sessions.push(currentSession);
    }

    // 4. Generate summary for each session
    sessions.forEach(session => {
      let totalDuration = 0;
      let uniqueProducts = new Set();
      let cartAdds = 0;
      let feedbackCount = 0;

      session.events.forEach(e => {
        if (e.type === 'behavior') {
          if (e.duration) totalDuration += e.duration;
          if (e.eventType === 'product_view' && e.metadata?.productName) {
            uniqueProducts.add(e.metadata.productName);
          }
          if (e.eventType === 'add_to_cart') cartAdds += (e.count || 1);
        } else if (e.type === 'feedback') {
          feedbackCount++;
        }
      });

      session.summary = {
        totalDuration,
        uniqueProducts: uniqueProducts.size,
        cartAdds,
        feedbackCount
      };
    });

    return sessions;
  };

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aqib-fyp');
  
  const feedbacks = await Feedback.find().limit(50).lean();
  let userId = null;
  for (let f of feedbacks) {
    const b = await BehaviorEvent.countDocuments({ userId: f.userId });
    if (b > 5) {
      userId = f.userId;
      break;
    }
  }
  
  if (!userId) {
     console.log("No user found with behaviors and feedback");
     process.exit(0);
  }
  
  const behaviors = await BehaviorEvent.find({ userId }).sort('timestamp').lean();
  const userFeedbacks = await Feedback.find({ userId }).lean();
  
  const mappedBehaviors = behaviors.map(b => ({ ...b, type: 'behavior', timestamp: b.timestamp }));
  const mappedFeedbacks = userFeedbacks.map(f => ({ ...f, type: 'feedback', timestamp: f.createdAt }));
  
  const timeline = [...mappedBehaviors, ...mappedFeedbacks].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  const sessions = processTimeline(timeline);
  
  console.log("Found User ID:", userId);
  sessions.forEach((s, idx) => {
    console.log(`\n=== Session ${idx+1} | Start: ${new Date(s.startTime).toLocaleTimeString()} ===`);
    console.log(`Summary: Viewed ${s.summary.uniqueProducts} product(s), spent ${s.summary.totalDuration}s total, added ${s.summary.cartAdds} item(s) to cart, left ${s.summary.feedbackCount} feedback(s)`);
    s.events.forEach(e => {
        if (e.type === 'behavior') {
            const count = e.count > 1 ? `(${e.count}x)` : '';
            const pathStr = e.eventType === 'page_view' ? (e.metadata?.path || '') : (e.metadata?.productName || '');
            console.log(`  - [${new Date(e.timestamp).toLocaleTimeString()}] BEHAVIOR: ${e.eventType} ${pathStr} ${count} (duration: ${e.duration}s)`);
        } else {
            console.log(`  - [${new Date(e.timestamp).toLocaleTimeString()}] FEEDBACK: ${e.rating} Stars (${e.sentiment}) - "${e.comment}"`);
        }
    });
  });
  
  process.exit(0);
}
test();
