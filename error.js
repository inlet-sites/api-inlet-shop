export const httpError = (res, code, message)=>{
    return res.status(code).json({
        error: true,
        message: message
    });
}

