const db = require('../config/connection');
const webpush = require('../config/push');

function notifyAdmins(title, body, options = {}) {
  // log('🔔 notifyAdmins() CALLED');
  // log('🔔 Title:', title);
  // log('🔔 Body:', body);
  // log('🖼️ Icon:', options.icon);

  db.get().query('SELECT * FROM admin_push_subscriptions', (err, subs) => {
    if (err) return;

    log(`📬 Subscriptions found: ${subs.length}`);

    subs.forEach((sub, i) => {
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        },
        JSON.stringify({
          title,
          body,
          icon: options.icon
        })
      ).then(() => {
        log(`✅ Push sent (${i + 1}/${subs.length})`);
      }).catch(err => {
        console.error('❌ Push failed', err.statusCode);
      });
    });
  });
}

module.exports = { notifyAdmins };
