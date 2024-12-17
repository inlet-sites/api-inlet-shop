export default (order, vendor)=>{
    return `
<p>Your order with ${vendor.store} has failed due to cancellation or payment failure</p>
<p>You can view the order details with the following link:</p>
<a href="https://api.inlet.shop/order/${order._id}?token=${order.uuid}">https://api.inlet.shop/order/${order._id}?token=${order.uuid}</a>
<p>You can try to make the order again at <a href="https://inlet.shop/${vendor.url}">https://inlet.shop/${vendor.url}</a></p>
`;
}
