# Documentation

This directory contains documentation for the hyperspectral classification software in this repository. I start with an overview of the different components of this software, followed by instructions on how to start the application suite. The next section contains the technical requirements to be able to run the software. I did my best to comment the code as good as possible, so I refer to the code files for further technical documentation. 

In the `backend` folder, you can find the ocelot gateway (see section 'microservice overview'), the .NET core backend, and the library for the database. These three projects are written in .NET core using the Visual Studio IDE, so I would recommend installing visual studio and opening the [solution file](../src/backend/backend.sln) for development.

The `frontend` folder contains the source files for the frontend, written in react.

Finally, the `python\api` folder contains the python API and related python files. 

## Technical requirements

This project uses Docker containers for its deployment. As such, the only technical requirements for the frontend, database, and .NET core backend are Linux or Windows with WSL installed, in combination with Docker (which comes packaged with docker-compose that you'll also need).

The microservices are relatively light-weight, so they can be run on pretty much all hardware. One notable exception is the python application, which takes care of training and validating the trained models. 

While the tensorflow framework that is used in this project will default to CPU-based learning if no GPU is present, it is recommended a (high-end) GPU card is utilized. While developing this project, I used the RTX 2070 Super by Nvidia.


## Microservice overview

### Database library

I chose MongoDB as my database technology of choice, because it has an addon (GridFS) which supports file storage. The database models are defined in the .NET Core `database` library, which should enable you to use any database technology you want, should you want to change it. A top-level folder structure of that libary can be found below. The database is deployed with [docker-compose](../src/docker-compose.yml).

- `Enums`: various enums for properties of database models
- `Models`: code-first implementation of the different tables and associated models for the database model
- `Services`: helper classes for complex interactions with the database model
- `Settings`: a collection of classes which are filled in from the `appsettings.json` file in the projects that include this library. They define, among other things, the name of the tables (called buckets in mongodb) in the databse model.

### .NET Core backend

Interaction with the database is done through a dedicated backend API, written in .NET Core version 3.1. I chose this because I am comfortable writing in C#, and because of .NET's robest code-first entity framework for interaction with databases. 

- `Controllers`: API controllers will respond to API requests, and are implemented in this directory. They usually do not interact directly with the database, rather they use various services (see directory 'Services') for database interaction.
- `Dto`: DTO's, or Data Transform Objects, are used to structure and validate API request bodies before they are processed by the API. They are used primarily by Controllers and Services.
- `Properties`: This API is a .NET project programmed in VisualStudio, so these properties serve only for development in Visual Studio.
- `Services`: Services are used for interaction with the database. They utilize the aforementioned database library for this purpose, allowing more complex functionality then just creating and deleting database objects, like the ability to compose complex lists of relations over multiple tables.
- `Settings`: To avoid the developer of having to edit the various API controllers to change the URL paths that they respond to, the URL's are defined in the appsettings.json file, which is consumed by the classes in this directory.

### Gateway

A Gateway in the context of microservices is the point-of-entry for external traffic to interact with the microservices suite. It is a fairly simple microservice, which is implemented in .NET using the [Ocelot library](https://github.com/ThreeMammals/Ocelot#:~:text=Ocelot%20is%20a%20.,that%20ASP.NET%20Core%20supports.).

- `configuration`: contains the configuration file for the API gateway. For more information on how it works, I refer to the Ocelot documentation.
- `Controllers`: singular controller to verify the status of the entrypoint of the microservice suite. If the API gateway is down, all other services are down as well.
- `Properties`: This Gateway is a .NET project programmed in VisualStudio, so these properties serve only for development in Visual Studio.

### Frontend

The frontend is the user's main way of interacting with the microservice application suite. It was written in React using the bootstrap-react package for responsive design. While the choice to use a javascript framework is an obvious one in this day and age, the choice for React was chosen partly because of my experience with it, and the fact that I consider using AngularJS for this project overkill. 

- `public`: public resources which are served statically by the webserver (the webserver used in this project is the built-in webserver of NPM)
- `src`: contains the source files for the website, the different subdirectories are listed below
    - `backend`: Axios is used for creating and executing API requests. The Axios code is present in this directory
    - `components`: This directory contains all React components and handles javascript functionality, state management, and sometimes elementary styling. For more information on React components, I refer to the official documentation. This directory contains most of the functionality and design of the website
    - `config`: Various bits of config, like where the backend javascript files should go to obtain connectivity with the API
    - `pages`: Each component in this directory corresponds with a webpage on the website. It consists of a mix of static content, state-dependent content and React components. Note that components are used by React for reusability over different webpages, and therefore it should come as no surprise that the components in this directory do not differ from the components in the 'components' directory.
    - `styling`: When more complex styling is required, it is implemented as a CSS class rather than applied in-line. This directory contains these CSS classes and are imported by the React components.

### Python API

The Python API is not deployed as a microservice by default because it requires the GPU for currently implemented architectures. To install the necessary drivers for tensorflow machine learning, I refer to the [official tensorflow gpu support documentation](https://www.tensorflow.org/install/gpu).

The folder structure of this program is pretty self-explanatory, and I urge you to inspect the files for more information on the inner workings of the API.