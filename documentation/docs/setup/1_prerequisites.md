# Prerequisites

Before you can run the AI Portal application, you must ensure that your development environment has the necessary tools and software installed. This section provides a detailed guide to these prerequisites.

## 1. Node.js

Node.js is a JavaScript runtime that allows you to run JavaScript code outside of a web browser. The AI Portal application requires **Node.js version 16 or higher**.

### Checking Your Node.js Version

To check if you have Node.js installed and to see the version, open your terminal and run the following command:

```bash
node -v
```

If Node.js is installed, you will see an output like `v18.12.1`. If the version is lower than 16, or if you see an error message, you will need to install or update Node.js.

### Installing Node.js

We recommend using a version manager like **nvm (Node Version Manager)** to install and manage multiple Node.js versions on your system.

*   **For macOS and Linux**, you can follow the installation instructions for [nvm](https://github.com/nvm-sh/nvm).
*   **For Windows**, you can use [nvm-windows](https://github.com/coreybutler/nvm-windows).

Once you have nvm installed, you can install the latest LTS (Long-Term Support) version of Node.js with the following command:

```bash
nvm install --lts
```

## 2. Package Manager (Yarn or npm)

A package manager is used to install and manage the project's dependencies. The AI Portal documentation uses **Yarn**, but you can also use **npm**, which comes bundled with Node.js.

### Checking Your Package Manager Version

To check if you have Yarn or npm installed, run one of the following commands:

```bash
yarn --version
# or
npm --version
```

### Installing Yarn

If you do not have Yarn installed, you can install it globally using npm:

```bash
npm install -g yarn
```

By ensuring these prerequisites are met, you will be ready to proceed with the installation and setup of the AI Portal application.