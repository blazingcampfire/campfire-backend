
const {onRequest} = require("firebase-functions/v2/https");
const {log, logger} = require("firebase-functions/logger");

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });

const firestore = admin.firestore();
admin.firestore().settings( { timestampsInSnapshots: true })

exports.deleteOldPosts = functions.pubsub.schedule('every 4 hours').timeZone('UTC').onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const oneWeekAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 7*24*60*60*1000);

    const ndQuery = admin.firestore().collection("users/notreDame/posts").where("date", "<", oneWeekAgo);
    const ndResults = await ndQuery.get();

    const yaleQuery = admin.firestore().collection("users/yale/posts").where('date', '<', oneWeekAgo);
    const yaleResults = await yaleQuery.get();

    const riceQuery = admin.firestore().collection("users/rice/posts").where('date', '<', oneWeekAgo);
    const riceResults = await riceQuery.get();
 

    ndResults.docs.forEach((docSnapshot) => {
        docSnapshot.ref.delete()
        console.log(`these are the ndResults: ${docSnapshot.data()}`)
    });

    yaleResults.docs.forEach((docSnapshot) => {
        docSnapshot.ref.delete()
        console.log(`these are the yaleResults: ${docSnapshot.data()}`)
    });

    riceResults.docs.forEach((docSnapshot) => {
        docSnapshot.ref.delete()
        console.log(`these are the riceResults: ${docSnapshot.data()}`)
    });

    console.log('Deleted old posts.');
    return null;
});

const postsPath = "users/{school}/posts/{postID}";

exports.sendNotification = onDocumentCreated(postsPath, async (event) => {
  functions.logger.log("New post was added");

  const snapshot = event.data;
  if (!snapshot) {
      console.log("No data associated with the event");
      return;
  }
  const data = snapshot.data();
  const name = data.name;
  const token = "eHZXlCDbSkFSo9NtzSmGlY:APA91bGFIm-u2YX7SHHiaUVpXVZhokP0swKC_ATVmbdq8TTRvimxO7nuejGabOOXiE03pD1T7jh71N6VnvmNOu57VW1pl7sI7ZBOTHAVJSuBzKoBafK0Vgoy553gFxKQ_94mRO-aGNsD"

  const response = await admin.messaging().send({
    token: token,
    notification: {
      title: "New Post!",
      body: `${name} just posted!`
    },
  })

  functions.logger.log("successfully sent notification");

});