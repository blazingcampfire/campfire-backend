
const {onRequest} = require("firebase-functions/v2/https");
const {log, logger} = require("firebase-functions/logger");

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

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