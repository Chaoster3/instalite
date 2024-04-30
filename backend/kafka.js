const { Kafka } = require('kafkajs');

var config = require('./config.json');

const kafka = new Kafka({
    clientId: 'g30',
    brokers: config.bootstrapServers
});

const producer = kafka.producer()
const consumer = kafka.consumer({
    groupId: config.groupId,
    bootstrapServers: config.bootstrapServers
});

var twitter_messages = [];

const getTwitterMessages = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: config.twitter_topic, fromBeginning: true });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            kafka_messages.push({
                value: message.value.toString(),
            });
        },
    });
};

var other_posts = [];

const getPosts = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: config.posts_topic, fromBeginning: true });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            other_posts.push({
                value: message.value.toString(),
            });
        },
    });
};

const publishPost = async (username, uuid, text, contentType, image) => {
    const post = {
        username,
        source_site: config.site_id,
        post_uuid_within_site: uuid,
        post_text: text,
        content_type: contentType,
    };
    await producer.send({
        topic: config.posts_topic,
        messages: [{ value: JSON.stringify({post, attach: image })}]
    })
}

getPosts().then( () => console.log(other_posts));