// import needed functions
const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

// create local app
const app = express();

// register express on local app and define routers
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

module.exports = app;
