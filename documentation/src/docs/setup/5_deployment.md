# Deployment

The AI Portal application is designed to be deployed to **Cloudflare Pages**, a platform for deploying and hosting frontend applications and Cloudflare Workers.

This section provides a high-level overview of the deployment process. For more detailed instructions, you should consult the official [Cloudflare Pages documentation](https://developers.cloudflare.com/pages/).

## 1. Push to a Git Repository

Cloudflare Pages deploys applications directly from a Git repository. Before you can deploy, you must push your local project code to a repository on a platform like GitHub, GitLab, or Bitbucket.

## 2. Create a Cloudflare Pages Project

1.  Log in to your Cloudflare dashboard.
2.  Navigate to **Workers & Pages** and click on **Create application**.
3.  Select the **Pages** tab and click **Connect to Git**.
4.  Choose the repository where you pushed your AI Portal code.

## 3. Configure Build Settings

Cloudflare will need to know how to build your application. You will need to configure the following settings:

*   **Framework preset**: Select **Vite**.
*   **Build command**: `npm run build`
*   **Build output directory**: `dist`

Cloudflare will automatically detect the correct settings for a Vite application, but it is a good practice to verify them.

## 4. Add Environment Variables

You must add the same environment variables from your local `.env` file to your Cloudflare Pages project settings. This is a critical step to ensure that your deployed application can connect to the necessary API services.

In your project settings on Cloudflare, navigate to **Settings > Environment variables** and add each variable one by one.

**Important:** Ensure that you set the `NODE_ENV` variable to `production` for your deployed application.

## 5. Deploy

Once you have configured the build settings and environment variables, you can click **Save and Deploy**. Cloudflare will then build and deploy your application.

After the deployment is complete, you will be provided with a unique URL where you can access your live AI Portal application.