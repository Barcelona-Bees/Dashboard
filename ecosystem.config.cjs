module.exports = {
    apps: [
        {
            name: "combo",
            cwd: "/home/student/combo",
            script: "src/backend/appLayer/al.js",
            env: {
                PORT: 3000,
                NODE_ENV: "production",

                PGHOST: "localhost",
                PGPORT: 5432,
                PGDATABASE: "siteinfo",
                PGUSER: "student",
                PGPASSWORD: "student"
            }
        }
    ]
}
