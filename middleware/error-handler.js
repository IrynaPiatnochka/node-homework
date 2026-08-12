module.exports = (err, req, res, next) => {
    console.error("ERROR:", err);

    if (err.code === "ECONNREFUSED" && err.port === 5432) {
        console.log("The database connection was refused. Is your database service running?");
    }

    if (err.name === "PrismaClientInitializationError") { 
        console.error("Couldn't connect to the database. Is it running?");

    }

    res.status(500).json({
        error: "Internal Server Error",
        message: err.message,
    });
};