// import needed functions from sendgrid/mail
const sgMail = require('@sendgrid/mail');

// set sendgrid api key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// define custom welcome mail
const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'taskManager@noreply.com',
    subject: 'Thanks for joining in!',
    text: `Welcome to the app, ${name}. Let us know about your opinions.`,
  });
  /*
    .catch((e) => {
      console.error(e.response.body);
    });
    */
};

// define custom cancellatiom mail
const sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'taskManager@noreply.com',
    subject: 'Sorry to see you go!',
    text: `Goodbye ${name}. We hope to see you back`,
  });
};

// export created custom functions
module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail,
};
