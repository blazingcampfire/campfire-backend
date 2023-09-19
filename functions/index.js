
const {onRequest} = require("firebase-functions/v2/https");
const {log, logger} = require("firebase-functions/logger");

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");

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

const relationshipsPath = "relationships/{school}/relationships/{relationshipID}";

exports.friendRequestNotifications = onDocumentUpdated(relationshipsPath, async (event) => {
  functions.logger.log("new relationship was added");

  const beforeSnapshot = event.data.before.data();
  const afterSnapshot = event.data.after.data();
  if (!beforeSnapshot || !afterSnapshot) {
      console.log("No data associated with the event");
      return;
  }

  if(afterSnapshot.ownRequests.length > beforeSnapshot.ownRequests.length) {
    const uid = event.params.relationshipID 
    const school = event.params.school
    const tokenSnap = await admin.firestore().collection(`notifications/${school}/fcmTokens`).doc(uid).get()
    const token = tokenSnap.data().fcmToken
    const requests = afterSnapshot.ownRequests
    const length = requests.length
    const name = requests[requests.length - 1].name
    const response = await admin.messaging().send({
      token: token,
      notification: {
        title: "new friend request!",
        body: `${name} just sent you a friend request!`
      },
    })
    functions.logger.log("successfully sent notification");
  }

  if(afterSnapshot.friends.length > beforeSnapshot.friends.length) {
    const uid = event.params.relationshipID 
    const school = event.params.school
    const tokenSnap = await admin.firestore().collection(`notifications/${school}/fcmTokens`).doc(uid).get()
    const token = tokenSnap.data().fcmToken
    const friends = afterSnapshot.friends
    const name = friends[friends.length - 1].name
    const response = await admin.messaging().send({
      token: token,
      notification: {
        title: "new friend!",
        body: `you and ${name} are now friends!`
      },
    })
    functions.logger.log("successfully sent notification");
  }
  
});

const postsPath = "users/{school}/posts/{postID}";

exports.postNotifications = onDocumentUpdated(postsPath, async (event) => {
  functions.logger.log("post document was updated");

  const beforeSnapshot = event.data.before.data();
  const afterSnapshot = event.data.after.data();
  if (!beforeSnapshot || !afterSnapshot) {
      console.log("No data associated with the event");
      return;
  }
  const posterName = afterSnapshot.name
  const uid = afterSnapshot.posterId
  const school = event.params.school
  if(afterSnapshot.numLikes > beforeSnapshot.numLikes) {
    functions.logger.log(afterSnapshot.numLikes)
    functions.logger.log(beforeSnapshot.numLikes)  
    const usersWhoLiked = afterSnapshot.usersWhoLiked
    // functions.logger.log(usersWhoLiked) 
    // const lastLikeUser = usersWhoLiked[usersWhoLiked.length - 1]
    // functions.logger.log(lastLikeUser)
    // const lastUserSnap = await admin.firestore().collection(`users/${school}/profiles`).doc(lastLikeUser).get()
    // const lastUserName = lastUserSnap.data().name
    const tokenSnap = await admin.firestore().collection(`notifications/${school}/fcmTokens`).doc(uid).get()
    const token = tokenSnap.data().fcmToken
    const response = await admin.messaging().send({
      token: token,
      notification: {
        title: "new like!",
        body: `someone just liked your post!`
      },
    })
    functions.logger.log("successfully sent notification");
  }

  // if(afterSnapshot.numLikes >= 10) {
  //   const tokensQuery = await admin.firestore().collection(`notifications/${school}/fcmTokens`).get()
  //   const tokens = tokensQuery.docs.map(doc => doc.data().fcmToken)
  //   functions.logger.log(tokens)
    
  //   tokens.map(token => (
  //     response = await admin.messaging().send({
  //       token: token,
  //       notification: {
  //         title: "new friend request!",
  //         body: `${name} just sent you a friend request!`
  //       },
  //     })
  //   ))
  // };
  
});

const commentsPath = "users/{school}/posts/{postID}/comments/{commentID}";

exports.commentNotifications = onDocumentCreated(commentsPath, async (event) => {
  functions.logger.log("comment document was created");

  const snapshot = event.data;
  if (!snapshot) {
      console.log("No data associated with the event");
      return;
  }
  const comment = snapshot.data()
  const postID = event.params.postID
  const school = event.params.school
  const post = await admin.firestore().collection(`users/${school}/posts`).doc(postID).get()
  const posterID = post.data().posterId 
    // functions.logger.log(usersWhoLiked) 
    // const lastLikeUser = usersWhoLiked[usersWhoLiked.length - 1]
    // functions.logger.log(lastLikeUser)
    // const lastUserSnap = await admin.firestore().collection(`users/${school}/profiles`).doc(lastLikeUser).get()
    // const lastUserName = lastUserSnap.data().name
    const commenterID = comment.posterId
    const commentText = comment.comment
    const commentSnap = await admin.firestore().collection(`users/${school}/profiles`).doc(commenterID).get() 
    const commenter = commentSnap.data()
    const name = commenter.name
    const tokenSnap = await admin.firestore().collection(`notifications/${school}/fcmTokens`).doc(posterID).get()
    const token = tokenSnap.data().fcmToken
    const response = await admin.messaging().send({
      token: token,
      notification: {
        title: "new comment!",
        body: `${name} just commented on your post: "${commentText}"`
      },
    })
    functions.logger.log("successfully sent notification");

  
});