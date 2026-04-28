import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Labour Management API",
    description: "API for Labour Hiring Platform",
  },
  host: "labour-management-backend.onrender.com", // production host
  schemes: ["https"], // use https for Render
};

const outputFile = "./swagger.json";
const endpointsFiles = ["./app.js"];

swaggerAutogen()(outputFile, endpointsFiles, doc);
