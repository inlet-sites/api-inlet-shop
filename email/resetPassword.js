export default (name, id, token)=>{
    return `
<p>Hello ${name},</p>

<p>We have recieved a request to reset your password. To do this, simply use the link below and enter your email address.</p>

<p>If you did not make this request, then you can safely ignore this email</p>

<a href="https://vendor.inlet.shop/password/${id}/${token}">vendor.inlet.shop/passowrd/${id}/${token}</a>

<p>-Inlet Sites</p>
`;
}
