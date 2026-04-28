import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Labour Management API",
    description: "API for Labour Hiring Platform",
  },
  host: "localhost:3000", // match your server port
  schemes: ["http"],
};

const outputFile = "./swagger.json"; // ✅ match your app.js
const endpointsFiles = ["./app.js"]; // ✅ correct entry

swaggerAutogen()(outputFile, endpointsFiles, doc);
