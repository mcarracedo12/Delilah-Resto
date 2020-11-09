Instructions to start:
1. Install Node.js in the computer from https://nodejs.org/en/
2. Open VSC, go to the terminal and write:
node
hit enter until it you see package.json in the folder.

Then, in the same terminal write:
npm init and again hit enter until you see package.json added in the folder.

Then write: 
npm install express
press enter until it is installed
npm install body-parser
press enter until it is installed
npm install jsonwebtoken
press enter until it is installed
npm i mysql2
press enter until it is installed

In package.json, you should be able to see all of them (express, body-parser, jsonwebtoken, mysql2) in the dependencies.

To start server:
node app
to stop server:
CTRL C


On the other hand, download a server (MAMP), make sure Apache and mySQL are running.

To try Postman, when sending a new request, make sure the port you send it to, matches the one the app.js file is listening to. 
For example: 127.0.0.1:3000/usuarios
127.0.01:3000/(endpoint)


To look for the API DOCUMENTATION you can go to: http://localhost:3000/api-docs






