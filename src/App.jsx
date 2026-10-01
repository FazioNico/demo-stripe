import { useEffect, useState } from "react";

const CREATE_SESSION_URL = import.meta.env.VITE_CREATE_SESSION_URL || "";

const CREATE_SUBSCRIPTION_SESSION_URL =
  import.meta.env.VITE_CREATE_SUBSCRIPTION_SESSION_URL || ""; // example: http://127.0.0.1:5001/my-project/createStripeSubscriptionSession?id=

function App() {
  const [count, setCount] = useState(0);
  const [productList, setProductList] = useState([]);

  // load product list from stripe
  useEffect(() => {}, []);

  const handleStripePayment = async () => {
    const response = await fetch(CREATE_SESSION_URL, { method: "POST" });
    const { url } = await response.json();
    window.location.href = url;
  };

  const handleStripeSubscription = async () => {
    const productId = "prod_VMNQ1SRCuUUxVw";
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
            <li>{product.name}</li>
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
          void handleStripeSubscription();
        }}
      >
        buy subscription product with stripe
      </button>
    </>
  );
}

export default App;
