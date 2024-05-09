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
const { Document } = require('langchain/document');

const dbsingleton = require('./access/db_access.js');
const db = dbsingleton;


async function rag(query) {
    try {
        const posts = await db.send_sql("SELECT post_id, content FROM posts WHERE post_id < 50");

        // Convert fetched data into Langchain document objects
        const documents = posts.map((post) => (
            new Document({ pageContent: post.content, metadata: { post_id: post.post_id } })
        ));

        // Create a vector store and index the documents
        console.log(documents);
        const number = [...Array(20)].map(() => Math.random().toString(36)[2]).join('');
        const vectorStore = await Chroma.fromDocuments(
            documents,
            new OpenAIEmbeddings(),
            {
                collectionName: number, // Specify the name of your collection
                url: "http://localhost:8000", // Optional: URL of the Chroma server
                collectionMetadata: {
                    "hnsw:space": "cosine",
                }, // Optional: specify the distance method of the embedding space
            }
        );

        const results = await vectorStore.similaritySearch(query, 5);
        console.log(results);

        const content = results.map((doc) => doc.pageContent).join('\n');
        console.log(content);

        const prompt = PromptTemplate.fromTemplate(`Explain why these posts {context} could be what I am looking for when I search for {question}`);

        const llm = new ChatOpenAI({
            modelName: "gpt-3.5-turbo",
            temperature: 0,
        });
        const ragChain = RunnableSequence.from([
            {
                context: new RunnablePassthrough(content),
                question: new RunnablePassthrough(),
            },
            prompt,
            llm,
            new StringOutputParser(),
        ]);

        const justification = await ragChain.invoke(query);
        console.log(justification);
        return [results, justification];

    } catch (error) {
        console.error("Error processing data:", error);
    }
}

module.exports = { rag }