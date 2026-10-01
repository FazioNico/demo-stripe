import { useEffect, useState } from "react";

const CREATE_SESSION_URL = import.meta.env.VITE_CREATE_SESSION_URL || "";

const CREATE_SUBSCRIPTION_SESSION_URL =
  import.meta.env.VITE_CREATE_SUBSCRIPTION_SESSION_URL || ""; // example: http://127.0.0.1:5001/my-project/createStripeSubscriptionSession?id=

const STRIPE_API_KEY = import.meta.env.VITE_STRIPE_API_KEY || ""; // restricted key (rk_...) with read-only Products permission

function App() {
  const [count, setCount] = useState(0);
  const [productList, setProductList] = useState([]);

  // load product list from stripe
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(
          "https://api.stripe.com/v1/products?active=true&limit=100",
          { headers: { Authorization: `Bearer ${STRIPE_API_KEY}` } },
        );
        if (!response.ok) throw new Error(`Stripe error ${response.status}`);
        const { data } = await response.json();
        console.log('>>>', data);
        setProductList(data);
      } catch (error) {
        console.error("Unable to load products", error);
      }
    };

    void loadProducts();
  }, []);

  const handleStripePayment = async () => {
    const response = await fetch(CREATE_SESSION_URL, { method: "POST" });
    const { url } = await response.json();
    window.location.href = url;
  };

  const handleStripeSubscription = async (productId) => {
    const response = await fetch(CREATE_SUBSCRIPTION_SESSION_URL + productId, {
      method: "POST",
    });
    const { url } = await response.json();
    window.location.href = url;
  };

  return (
    <>
      {productList.length > 0 ? (
        <ul>
          {productList.map((product) => (
            <li key={product.id}>
              <img src={product.images[0]} width="100px" /> {product.name} 
              <button onClick={() => {
                handleStripeSubscription(product.id);
              }}>buy</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>loading products...</p>
      )}

      <button
        onClick={() => {
          void handleStripePayment();
        }}
      >
        buy single product with stripe
      </button>

      <button
        onClick={() => {
          void handleStripeSubscription('prod_VMNQ1SRCuUUxVw');
        }}
      >
        buy subscription product with stripe
      </button>
    </>
  );
}

export default App;
