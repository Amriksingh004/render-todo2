# Little List — frontend + backend

A small working task-list app, ready to deploy as ONE Render Web Service.

- Frontend: plain HTML, CSS, and JavaScript in `public/`.
- Backend: Node.js in `server.js`, serving both the frontend and a JSON API.
- Add tasks, mark them complete, filter the list, and delete them.
- No API keys, external packages, database, or separate frontend deployment required.

## Deploy on Render

1. Verify your email if Render asks you to.
2. Extract the ZIP. Create a new repository on GitHub and upload the **contents of `render-task-app`**. `package.json`, `server.js`, `render.yaml`, and the `public` folder should be at the repository's top level. Upload the extracted files, not the ZIP.
3. In Render, choose **New → Web Service**. Connect GitHub and select that repository.
4. Use these settings:

| Setting | Value |
| --- | --- |
| Name | `little-list` (or another name) |
| Language / Runtime | Node |
| Branch | Your repository's default branch, usually `main` |
| Root Directory | Leave blank if the files are at the top level |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free, if available for your account |
| Health Check Path (Advanced) | `/api/health` |
| Environment variable | `NODE_VERSION` = `24.11.1` |

5. Click **Create Web Service**. Once deployment is live, open the `https://...onrender.com` address Render provides. The frontend and backend are both at that address.

Choose **Web Service**, because this project includes a running backend. A Static Site would not run the API.

### Optional: automatic configuration

The included `render.yaml` contains the settings above. Instead of creating a Web Service manually, choose **New → Blueprint**, select the repository, review the configuration, and deploy it. You only need one of these deployment methods.

## Run on your computer

Install Node.js 22 or 24, open a terminal in this folder, and run:

```sh
npm start
```

Open http://localhost:3000. No dependency installation is needed locally. For automatic restart while editing, use `npm run dev`. Run the integration check with `npm test`.

## How the two parts connect

The browser loads `public/index.html`, `styles.css`, and `app.js` from the Node server. The frontend calls the backend using relative URLs like `/api/tasks`, so there is no separate backend URL to configure.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Server health |
| GET | `/api/tasks` | Read tasks |
| POST | `/api/tasks` | Add a task; JSON: `{"title":"My task"}` |
| PATCH | `/api/tasks/:id` | Change completion; JSON: `{"completed":true}` |
| DELETE | `/api/tasks/:id` | Delete a task |

## Demo limitations

Tasks are stored in server memory. They disappear when the server restarts, redeploys, or a sleeping service starts again. Everyone using the app sees and can edit the same list; it has no accounts. Use sample data. Changes by other visitors appear when you click Refresh list. This starter is limited to 200 tasks, each up to 120 characters.

For lasting personal data, the next step is a database and user authentication. Free Render services may sleep when idle, so the first visit can take longer. Review the plan details in Render before deploying.

Render docs: https://render.com/docs/web-services
Blueprint docs: https://render.com/docs/blueprint-spec
