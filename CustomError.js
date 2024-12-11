class CustomError extends Error {
    constructor(code, message){
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

const catchError = (err, req, res, next)=>{
    if(err instanceof CustomError){
        return res.status(err.code).json({
            error: {
                code: err.code,
                message: err.message
            }
        });
    }

    console.error(err);
    return res.status(500).json({
        error: {
            code: 500,
            message: "Internal server error"
        }
    });
}

export {
    CustomError,
    catchError
};
