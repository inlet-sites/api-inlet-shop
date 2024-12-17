export default (order, vendor)=>{
    return `
<p>Hello ${order.name},</p>
<p>Thank you for shopping with ${vendor.store}</p>
<p>Your order has beend recieved and is now processing</p>
<p>To view details of your order, including the current status, use the following link:</p>
<a href="https://inlet.shop/order/${order._id}?token=${order.uuid}">https://inlet.shop/order/${order._id}?token=${order.uuid}</a>
<p>Save this link to check in on the status of your order at any time</p>
<p>If you need assistance with your order, please use the following contact information:</p>
<a href="mailto:${vendor.contact.email}">${vendor.contact.email}</a>
<p>${vendor.contact.phone}</p>
<p>If you have trouble reaching anybody, then you can contact Inlet Sites at <a href="mailto:support@inletsites.dev">support@inletsites.dev</a> and we will attempt to reach out to ${vendor.store} on your behalf.</p>
<p>Thank you for your purchase!</p>
`;
}
