import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.sql.*;
import org.apache.spark.graphx.Edge;
import java.util.Properties;

public class SparkJob {
    public static void main(String[] args) {
        SparkSession spark = SparkSession.builder()
                .appName("SparkJob")
                .getOrCreate();

        // Define JDBC connection properties
        String url = "jdbc:mysql://your-rds-host:your-rds-port/your-database";
        String user = "your-username";
        String password = "your-password";
        Properties connectionProperties = new Properties();
        connectionProperties.setProperty("user", user);
        connectionProperties.setProperty("password", password);

        // Read data from RDS
        Dataset<Row> hashtags = spark.read().jdbc(url, "hashtags", connectionProperties);
        Dataset<Row> posts = spark.read().jdbc(url, "posts", connectionProperties);
        Dataset<Row> users = spark.read().jdbc(url, "users", connectionProperties);
        Dataset<Row> friends = spark.read().jdbc(url, "friends", connectionProperties);
        
        // Create vertices from hashtags, posts, and users
        Dataset<Tuple2<String, String>> vertices = hashtags.selectExpr("concat('hash', hashtag_id) AS id")
                .union(posts.selectExpr("concat('post', post_id) AS id"))
                .union(users.selectExpr("concat('user', user_id) AS id"))
                .as(Encoders.tuple(Encoders.STRING(), Encoders.STRING()));

        Dataset<Tuple2<String, String>> user_edges = users.flatMap(row -> {
            long user_id = row.getAs("user_id");
            String user_id_str = "user" + user_id;
            String hashtags = row.getAs("interests");
        
            List<Tuple2<String, String>> edges = new ArrayList<>();
            for (String hashtag : hashtags.substring(1, hashtags.length() - 1).split(",")){
                edges.add(new Tuple2<>(user_id_str, "hash" + hashtag));
                edges.add(new Tuple2<>("hash" + hashtag, user_id_str));
            }
            return edges.iterator();
        }, Encoders.tuple(Encoders.STRING(), Encoders.STRING()));

        Dataset<Tuple2<String, String>> hash_post_edges = posts.flatMap(row -> {
            long post_id = row.getAs("post_id");
            String post_id_str = "post" + post_id;
            String hashtags = row.getAs("interests");
            String likes = row.getAs("likes");
        
            List<Tuple2<String, String>> edges = new ArrayList<>();
            for (String hashtag : hashtags.substring(1, hashtags.length() - 1).split(",")){
                edges.add(new Tuple2<>("hash" + hashtag, post_id_str));
                edges.add(new Tuple2<>(post_id_str, "hash" + hashtag));
            }
            for (String like : likes.substring(1, likes.length() - 1).split(",")){
                edges.add(new Tuple2<>("user" + like, post_id_str));
                edges.add(new Tuple2<>(post_id_str, "user" + like));
            }
            return edges.iterator();
        }, Encoders.tuple(Encoders.STRING(), Encoders.STRING()));

        Dataset<Tuple2<String, String>> user_user_edges = friends.flatMap(row -> {
            long user_id1 = row.getAs("follower");
            long user_id2 = row.getAs("followed");
            String user_id1_str = "user" + user_id1;
            String user_id2_str = "user" + user_id2;
        
            List<Tuple2<String, String>> edges = new ArrayList<>();
            edges.add(new Tuple2<>(user_id1_str, user_id2_str));
            edges.add(new Tuple2<>(user_id2_str, user_id1_str));
            return edges.iterator();
        }, Encoders.tuple(Encoders.STRING(), Encoders.STRING()));

        // Create edges
        Dataset<Edge<Tuple2<Object, Object>>> edges = spark.createDataset(Arrays.asList(
                new Edge<>(1L, 4L, new Tuple2<>(0.3, "Interest")),   // (User1, Hashtag1)
                new Edge<>(4L, 1L, new Tuple2<>(0.3, "Interest")),   // (Hashtag1, User1)
                new Edge<>(4L, 5L, new Tuple2<>(1.0, "Associated")), // (Hashtag1, Post1)
                new Edge<>(5L, 4L, new Tuple2<>(1.0, "Associated")), // (Post1, Hashtag1)
                new Edge<>(1L, 5L, new Tuple2<>(0.4, "Liked")),      // (User1, Post1)
                new Edge<>(5L, 1L, new Tuple2<>(0.4, "Liked")),      // (Post1, User1)
                new Edge<>(1L, 2L, new Tuple2<>(0.3, "Friend")),     // (User1, User2)
                new Edge<>(2L, 1L, new Tuple2<>(0.3, "Friend"))      // (User2, User1)
        ), Encoders.bean(Edge.class));

        // Build the graph
        Graph<Tuple2<Object, Object>, Tuple2<Double, String>> graph = Graph.apply(vertices.rdd(),
                edges.rdd(),
                new Tuple2<>(null, null));

        // Assign weights
        Graph<Tuple2<Object, Object>, Tuple2<Double, String>> weightedGraph = graph.mapTriplets(triplet -> {
            double weight = triplet.attr()._1();
            String edgeType = triplet.attr()._2();
            // Adjust weights based on edge type
            if (edgeType.equals("Interest") || edgeType.equals("Friend")) {
                weight *= 0.3; // Scale down weights
            } else if (edgeType.equals("Liked")) {
                weight *= 0.4; // Scale down weights
            }
            return new Tuple2<>(weight, edgeType);
        });
        // Perform transformations
        Dataset<Row> transformedDF = df.select("hashtag_id", "name", "count").filter("count > 100");

        // Write data back to RDS
        transformedDF.write().jdbc(url, "hashtags_transformed", connectionProperties);

        // Send data to Livy via API (assuming LivyClient is set up)
        LivyClient livyClient = new LivyClientBuilder().setURI("http://your-livy-host:8998").build();
        String code = "print('Data processed successfully')";
        livyClient.submit(new LivyJob(code));
        livyClient.stop(true);

        spark.stop();
    }
}
