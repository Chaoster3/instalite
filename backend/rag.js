const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { OpenAIEmbeddings, ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { formatDocumentsAsString } = require("langchain/util/document");

const {
    RunnableSequence,
    RunnablePassthrough,
} = require("@langchain/core/runnables");
const process = require('process');

const dbsingleton = require('./access/db_access.js');


const db = dbsingleton;



async function rag(query) {
    try {
        const posts = await db.send_sql("SELECT post_id, content FROM posts");

        // Convert fetched data into Langchain document objects
        const documents = posts.map((post) => ({
            id: post.post_id, // Use a unique identifier for each document
            text: post.content, // Replace 'text_column' with the appropriate column name
        }));

        // Create a vector store and index the documents
        console.log(documents);
        const vectorStore = await Chroma.fromDocuments(
            documents,
            new OpenAIEmbeddings(),
            {
                collectionName: "posts", // Specify the name of your collection
                url: "http://localhost:8000", // Optional: URL of the Chroma server
                collectionMetadata: {
                    "hnsw:space": "cosine",
                }, // Optional: specify the distance method of the embedding space
            }
        );

        // Perform a similarity search
        // const searchResult = await vectorStore.similaritySearch("search query", 5);
        const llm = new ChatOpenAI({
            modelName: "gpt-3.5-turbo",
            temperature: 0,
        });

        const retriever = vectorStore.asRetriever();

        const prompt = PromptTemplate.fromTemplate("Answer this: {question} in this context: {context}");

        const ragChain = RunnableSequence.from([
            {
                context: retriever.pipe(formatDocumentsAsString),
                question: new RunnablePassthrough(),
            },
            prompt,
            llm,
            new StringOutputParser(),
        ]);

        result = await ragChain.invoke(req.body.question);
        console.log(result);
        // res.status(200).json({ message: result });

    } catch (error) {
        console.error("Error processing data:", error);
    } 
}

// Call the main function to start the process
rag("What post is closest to my interest in apples?");