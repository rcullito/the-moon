## Running the Application
    cd ganymede
    npm install
    npm start

## Design Decisions

### 1. Schema.

For quick iteration I opted to make a json scheme that could be read easily, located in /public/json/rooms.json. I wanted it to be complex enough to require several deployments of drones but simple enough to be able to able to easily determine whether the drones were finding the passages to new rooms correctly. The attached screenshots are meant to illustrate the pattern between network requests and drones identifying new passages(assuming a labyrinth entrance at Point Omega) For naming conventions I chose books by Don Delillo, which seemed to fit oddly well as Ganymedian Labyrinth rooms.

![network requests](/public/images/networkRequests.png)
![network requests](/public/images/sketchedSchema.jpg)


### 2. The Express App
I used the boilerplate express generator to keep things simple, removing view logic that I didn't need and adding middleware such as the check for the proper email header. The rest of the application code was put into ganymede/routes. The environment was improved as needed, adding in dependencies, livereload, and gulp tasks.

### 3. Finding the Solution: Nasa & Apollo

To produce the solution, an application was needed that could call the RESTful interface in the proper sequence.
Since this code is being packaged and sent to Airtime I didn't want a process that would require starting an express server and then a completely separate application that would make calls against that server. The syntax of the Supertest npm module made sense as the express app could be imported and utilized easily.

The business logic for the solution is split between two files, apollo.js and nasa.js. Apollo manages the http requests and async logic. Nasa handles the necessary data processing and keeps track of explored rooms and recorded messages. The logic kicks off at the end of the apollo.js file with a call to the landOnGanymede function.
