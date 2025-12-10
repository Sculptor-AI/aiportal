# Installation

This section guides you through the process of getting the AI Portal application code onto your local machine and installing all the required dependencies.

## 1. Clone the Repository

The first step is to clone the project's source code from its Git repository. You will need to have [Git](https://git-scm.com/) installed on your system to do this.

Open your terminal, navigate to the directory where you want to store the project, and run the following command:

```bash
git clone https://github.com/your-username/aiportal.git
```

This will create a new directory named `aiportal` containing the project files.

## 2. Navigate to the Project Directory

Once the repository is cloned, you need to move into the project directory. All subsequent commands should be run from the root of this directory.

```bash
cd aiportal
```

## 3. Install Dependencies

The AI Portal application is a monorepo that contains both the frontend and backend code. The project uses a single `package.json` file to manage dependencies for both parts of the application.

To install all the necessary libraries and packages, run the following command from the project root:

```bash
yarn install
```

This command will read the `yarn.lock` file and install the exact versions of the dependencies specified. This process may take a few minutes to complete.

Once the installation is finished, you will have a `node_modules` directory in your project folder containing all the required packages. You are now ready to configure the application's environment variables.