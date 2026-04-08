async function test() {
    try {
        const response = await fetch("https://fullstack-project-review-04.vercel.app/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test@gmail.com", password: "password" })
        });
        console.log("Status:", response.status);
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            console.log("Response Body (JSON):", JSON.stringify(data, null, 2));
        } catch (e) {
            console.log("Response Body (Text):", text.substring(0, 500));
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}
test();
