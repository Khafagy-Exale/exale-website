Netlify deployment instructions

This repo contains multiple static sites in subfolders. Use one of the two approaches below depending on how you want to deploy.

Option A - Single site (Main website only)
1. Create a new site on Netlify.
2. In Site settings -> Deploy settings, set the "Base directory" (publish directory) to "Main-Website" (it will publish the landing site at the root domain).
3. Add your domain (exale.net) in Site settings -> Domain management.

Option B - Multi-site (subdomains for portal/admin)
1. Create three separate sites on Netlify, each pointing to the same repo but with different "Publish directory" values:
   - Main site: Publish directory = "Main-Website" (exale.net)
   - Client Portal: Publish directory = "Client-Portal" (client.exale.net)
   - Admin Dashboard: Publish directory = "Admin-Dashboard" (dashboard.exale.net)
2. Configure DNS records and add the correct domain/subdomain to each Netlify site.

Notes
- The repo already includes `netlify.toml` with the default publish directory set to `Main-Website`.
- Directory-based URLs (e.g., /services) will work out-of-the-box on Netlify when publishing a folder that contains `services/index.html`.
- For SPA routing you can add a `_redirects` file if needed (not added by default to avoid overriding static folder behavior).