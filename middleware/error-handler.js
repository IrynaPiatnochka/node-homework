module.exports = (err, req, res, next) => {
    if (err.code === "ECONNREFUSED" && err.port === 5432) { // the postgresql port
        console.log("The database connection was refused.  Is your database service running?");
    }
    res.status(500).json({
        error: "Internal Server Error",
    });
};