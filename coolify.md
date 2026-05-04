Ah, that completely explains it!

Since you are hosting the live site on your own Coolify instance, that 177.7.34.123 IP address is the IP of your actual Coolify server. Coolify had automatically spun up a Postgres database right there on the server for you alongside the app.

Since we just spent time setting up a beautifully clean, dedicated Neon database specifically for production (split_prod), there is one extremely important step you need to take:

You need to log into your Coolify dashboard, navigate to the environment variables settings for split.goldtending.com, and update the DATABASE_URL to use your new .env.production connection string!

If you don't update that variable in the Coolify dashboard, your live website will keep talking to the old Coolify Postgres database instead of the shiny new Neon one we just prepared for it.


https://docs.coolify.io/self-hosting/server-settings/databases/connecting-to-external-databases 
