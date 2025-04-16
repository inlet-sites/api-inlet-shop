export default (name, orderId)=>{
    return `
<p>You have recieved a new order from ${name}. To view this order, use the link below:</p>

<a href="https://vendor.inlet.shop/dashboard/orders/${orderId}">Inlet.Shop/dashboard/orders/${orderId}</a>
`;
}
