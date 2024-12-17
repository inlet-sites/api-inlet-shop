export default (order)=>{
    return `
<p>Hello ${order.name},</p>
<p>Thank you for shopping with Inlet Sites</p>
<p>We have recieved your order and it is now processing</p>
<p>To view details of your order, including the current status, use the link below</p>
<a href="https://inlet.shop/order/${order._id}?token=${order.uuid}">https://inlet.shop/order/${order._id}?token=${order.uuid}</a>
<p>Save this link to check in on the status of your order</p>
<p>If you need assistance with your order, please use the contact information provided on the order page through the link above.</p>
<p>If you have trouble reaching anybody, then you can contact Inlet Sites at <a href="mailto:lee@inletsites.dev">lee@inletsites.dev</a>
<p>Thank you for your purchase!</p>
`;
}
