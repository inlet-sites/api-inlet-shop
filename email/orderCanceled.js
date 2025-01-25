export default (orderId, orderToken, note)=>{
    return `
<p>The order that you have placed through Inlet.Shop has been declined by the vendor.</p>
<p>You will be issued a full refund within 10 business days.</p>

<p>Reason from vendor:</p>
<p>"${note}"</p>

<p>View the order information here:</p>
<a href="https://inlet.shop/order/${orderId}/${orderToken}">https://inlet.shop/order/${orderId}/${orderToken}</a>
`;
}
