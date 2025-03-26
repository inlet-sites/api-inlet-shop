export default (order)=>{
    return `
<p>Your order (No. ${order.orderNumber}) has been shipped.</p>

<p>You can review your order with the following link:</p>

<a href="https://inlet.shop/order/${order._id}/${order.uuid}">https://inlet.shop/order/${order._id}/${order.uuid}</a>
`;
}
