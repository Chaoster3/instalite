package edu.upenn.cis.nets2120.hw3;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.ResultSet;
import java.util.*;
import java.util.stream.Collectors;

import org.apache.commons.collections.map.HashedMap;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;

import edu.upenn.cis.nets2120.config.Config;
import edu.upenn.cis.nets2120.storage.SparkConnector;
import scala.Tuple2;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectOutputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.spark.SparkContext;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.function.PairFlatMapFunction;
import java.io.ByteArrayOutputStream;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.livy.Job;
import org.apache.livy.JobContext;
import java.sql.Connection;
import scala.Tuple2;
import org.apache.spark.api.java.JavaSparkContext;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import org.apache.spark.sql.*;
import java.util.Properties;
import java.util.List;
import java.io.IOException;
import java.io.ObjectOutputStream;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;
import io.github.cdimascio.dotenv.Dotenv;
import java.util.Collections;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.apache.livy.JobContext;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.function.PairFlatMapFunction;
import org.apache.spark.sql.SparkSession;

import scala.Tuple2;

public class FriendsOfFriendsSpark {
    static Logger logger = LogManager.getLogger(FriendsOfFriendsSpark.class);

    /**
     * Connection to Apache Spark
     */
    SparkSession spark;
    JavaSparkContext context;

    public FriendsOfFriendsSpark() {
        System.setProperty("file.encoding", "UTF-8");
    }

    /**
     * Initialize the database connection. Do not modify this method.
     *
     * @throws InterruptedException User presses Ctrl-C
     */
    public void initialize() throws InterruptedException {
        logger.info("Connecting to Spark...");

        spark = SparkConnector.getSparkConnection();
        context = SparkConnector.getSparkContext();

        logger.debug("Connected!");
    }

    public Dataset<Row> getTable(String table) {
        try {
            logger.info("Loading data from table: " + table);

            // Use DataFrameReader to handle the JDBC connection
            DataFrameReader dataFrameReader = spark.read()
                    .format("jdbc")
                    .option("url", Config.DATABASE_CONNECTION)
                    .option("dbtable", table)
                    .option("user", Config.DATABASE_USERNAME)
                    .option("password", Config.DATABASE_PASSWORD);

            // Load the table into a Dataset<Row>
            Dataset<Row> df = dataFrameReader.load();

            return df;
        } catch (Exception e) {
            logger.error("An error occurred: " + e.getMessage(), e);
        }
        // Return an empty Dataset if unable to load data
        return spark.emptyDataFrame();
    }

    /**
     * Main functionality in the program: read and process the social network. Do
     * not modify this method.
     *
     * @throws IOException          File read, network, and other errors
     * @throws InterruptedException User presses Ctrl-C
     */
    public void run() throws IOException, InterruptedException {
        logger.info("Running");

        // Read data from RDS
        Dataset<Row> hashtags = getTable("hashtags");
        Dataset<Row> posts = getTable("posts");
        Dataset<Row> users = getTable("users");
        Dataset<Row> friends = getTable("friends");
        System.out.println("Loaded tables");
        JavaPairRDD<String, Map<String, Double>> vertices = vertices(hashtags, posts, users);
        System.out.println("Loaded vertices");
        JavaPairRDD<String, Tuple2<String, Double>> user_edges = edges(hashtags, posts, users, friends);
        System.out.println("Loaded edges");

        JavaPairRDD<String, Map<String, Double>> adsorption_vertices = adsorption(vertices, user_edges);
        System.out.println("Loaded adsorption vertices");

        JavaPairRDD<String, Map<String, Double>> userDistributions = userDistributions(adsorption_vertices);
        System.out.println("Loaded user distributions");

        JavaPairRDD<String, Map<String, Double>> friendRecommendations = friendRecommendations(adsorption_vertices,
                friends);
        System.out.println("Loaded friend recommendations");

        ObjectMapper mapper = new ObjectMapper();

        try {
            // Collect the results to the driver node
            List<Tuple2<String, Map<String, Double>>> userDistList = userDistributions.collect();
            List<Tuple2<String, Map<String, Double>>> friendRecList = friendRecommendations.collect();

            // Open a single connection
            try (Connection connection = DriverManager.getConnection(Config.DATABASE_CONNECTION,
                    Config.DATABASE_USERNAME, Config.DATABASE_PASSWORD)) {
                // Prepare the statement for user distributions
                String userDistQuery = "UPDATE users SET rank_distribution = ? WHERE user_id = ?";
                try (PreparedStatement userDistStmt = connection.prepareStatement(userDistQuery)) {
                    for (Tuple2<String, Map<String, Double>> tuple : userDistList) {
                        userDistStmt.setString(1, mapper.writeValueAsString(tuple._2));
                        userDistStmt.setString(2, tuple._1);
                        userDistStmt.addBatch();
                    }
                    userDistStmt.executeBatch(); // Execute all updates together
                }

                // Prepare the statement for friend recommendations
                String friendRecQuery = "UPDATE users SET friend_recommendation = ? WHERE user_id = ?";
                try (PreparedStatement friendRecStmt = connection.prepareStatement(friendRecQuery)) {
                    for (Tuple2<String, Map<String, Double>> tuple : friendRecList) {
                        friendRecStmt.setString(1, mapper.writeValueAsString(tuple._2));
                        friendRecStmt.setString(2, tuple._1);
                        friendRecStmt.addBatch();
                    }
                    friendRecStmt.executeBatch(); // Execute all updates together
                }
            }
        } catch (SQLException e) {
            logger.error("Error sending recommendations to database: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Error processing JSON: " + e.getMessage(), e);
        }
        logger.info("*** Finished! ***");
    }

    static JavaPairRDD<String, Map<String, Double>> vertices(Dataset<Row> hashtags, Dataset<Row> posts,
            Dataset<Row> users) {
        JavaPairRDD<String, Map<String, Double>> vertices = hashtags.selectExpr("concat('hash', hashtag_id) AS id")
                .union(posts.selectExpr("concat('post', post_id) AS id"))
                .union(users.selectExpr("concat('user', user_id) AS id"))
                .union(users.selectExpr("concat('shadow', user_id) AS id")).toJavaRDD()
                .map(row -> (String) row.getAs("id"))
                .mapToPair(id -> {
                    if (id.startsWith("shadow")) {
                        return new Tuple2<>(id, new HashMap<String, Double>() {
                            {
                                put(id.substring(6), 1.0);
                            }
                        });
                    } else {
                        return new Tuple2<>(id, new HashMap<String, Double>());
                    }
                });
        return vertices;
    }

    static JavaPairRDD<String, Tuple2<String, Double>> edges(Dataset<Row> hashtags, Dataset<Row> posts,
            Dataset<Row> users,
            Dataset<Row> friends) {
        JavaPairRDD<String, String> user_edges = users.toJavaRDD().flatMapToPair(row -> {
            int user_id = row.getAs("user_id");
            String user_id_str = "user" + user_id;
            String interests = (String) row.getAs("interests");

            List<Tuple2<String, String>> edges = new ArrayList<>();
            if (interests != null && !interests.isEmpty() && !interests.equals("[]") && !interests.equals(",")) {
                // for (String hashtag : interests.substring(1, interests.length() -
                // 1).split(",")) {
                // edges.add(new Tuple2<>(user_id_str, "hash" + hashtag));
                // edges.add(new Tuple2<>("hash" + hashtag, user_id_str));
                // }
                for (String hashtag : interests.split(",")) {
                    edges.add(new Tuple2<>(user_id_str, "hash" + hashtag));
                    edges.add(new Tuple2<>("hash" + hashtag, user_id_str));
                }
            }
            edges.add(new Tuple2<>("shadow" + user_id, user_id_str));
            return edges.iterator();
        });

        JavaPairRDD<String, String> hash_post_edges = posts.toJavaRDD().flatMapToPair(row -> {
            int post_id = row.getAs("post_id");
            String post_id_str = "post" + post_id;
            String interests = row.getAs("hashtag_ids");
            String likes = row.getAs("user_ids_who_liked");

            List<Tuple2<String, String>> edges = new ArrayList<>();
            if (interests != null && !interests.isEmpty() && !interests.equals("[]")) {
                for (String hashtag : interests.substring(1, interests.length() - 1).split(",")) {
                    edges.add(new Tuple2<>("hash" + hashtag, post_id_str));
                    edges.add(new Tuple2<>(post_id_str, "hash" + hashtag));
                }
            }
            if (likes != null && !likes.isEmpty() && !likes.equals("[]")) {
                for (String like : likes.substring(1, likes.length() - 1).split(",")) {
                    edges.add(new Tuple2<>("user" + like, post_id_str));
                    edges.add(new Tuple2<>(post_id_str, "user" + like));
                }
            }
            return edges.iterator();
        });

        JavaPairRDD<String, String> user_user_edges = friends.toJavaRDD().flatMapToPair(row -> {
            int user_id1 = row.getAs("follower");
            int user_id2 = row.getAs("followed");
            String user_id1_str = "user" + user_id1;
            String user_id2_str = "user" + user_id2;

            List<Tuple2<String, String>> edges = new ArrayList<>();
            edges.add(new Tuple2<>(user_id1_str, user_id2_str));
            edges.add(new Tuple2<>(user_id2_str, user_id1_str));
            return edges.iterator();
        });

        JavaPairRDD<String, String> edges = user_edges.union(hash_post_edges).union(user_user_edges);
        JavaPairRDD<String, Tuple2<String, Double>> w_edges = edges.groupByKey().flatMapToPair(edge -> {
            String src = edge._1();
            List<Tuple2<String, Tuple2<String, Double>>> weighted_edges = new ArrayList<>();
            List<String> dsts = new ArrayList<>();
            edge._2().forEach(dsts::add);
            if (src.startsWith("user")) {
                List<String> hash_dsts = dsts.stream().filter(dst -> dst.startsWith("hash"))
                        .collect(Collectors.toList());
                List<String> user_dsts = dsts.stream().filter(dst -> dst.startsWith("user"))
                        .collect(Collectors.toList());
                List<String> post_dsts = dsts.stream().filter(dst -> dst.startsWith("post"))
                        .collect(Collectors.toList());
                for (String hash_dst : hash_dsts) {
                    weighted_edges.add(new Tuple2<>(src, new Tuple2<>(hash_dst, 0.3 / hash_dsts.size())));
                }
                for (String user_dst : user_dsts) {
                    weighted_edges.add(new Tuple2<>(src, new Tuple2<>(user_dst, 0.3 / user_dsts.size())));
                }
                for (String post_dst : post_dsts) {
                    weighted_edges.add(new Tuple2<>(src, new Tuple2<>(post_dst, 0.4 / post_dsts.size())));
                }
            } else if (src.startsWith("hash")) {
                for (String dst : dsts) {
                    weighted_edges.add(new Tuple2<>(src, new Tuple2<>(dst, 1.0 / dsts.size())));
                }
            } else {
                for (String dst : dsts) {
                    weighted_edges.add(new Tuple2<>(src, new Tuple2<>(dst, 1.0 / dsts.size())));
                }
            }
            return weighted_edges.iterator();
        });
        return w_edges;
    }

    static JavaPairRDD<String, Map<String, Double>> adsorption(JavaPairRDD<String, Map<String, Double>> vertices,
            JavaPairRDD<String, Tuple2<String, Double>> user_edges) {
        int iteration = 0;
        while (true && iteration++ < 15) {
            JavaPairRDD<String, Map<String, Double>> new_vertices = user_edges.join(vertices).mapToPair(edge -> {
                String v = edge._2()._1()._1();
                Double edge_weight = edge._2()._1()._2();
                Map<String, Double> L_u = edge._2()._2();
                Map<String, Double> u_contribution = L_u.entrySet().stream().map(entry -> {
                    String label = entry.getKey();
                    double weight = entry.getValue();
                    return new Tuple2<>(label, weight * edge_weight);
                }).collect(Collectors.toMap(Tuple2::_1, Tuple2::_2));
                return new Tuple2<>(v, u_contribution);
            }).reduceByKey((u1, u2) -> {
                Map<String, Double> u = new HashMap<>();
                for (Map.Entry<String, Double> entry : u1.entrySet()) {
                    u.put(entry.getKey(), u.getOrDefault(entry.getKey(), 0.0) + entry.getValue());
                }
                for (Map.Entry<String, Double> entry : u2.entrySet()) {
                    u.put(entry.getKey(), u.getOrDefault(entry.getKey(), 0.0) + entry.getValue());
                }
                return u;
            }).mapValues(u -> {
                double sum = u.values().stream().mapToDouble(Double::doubleValue).sum();
                return u.entrySet().stream().map(entry -> {
                    String label = entry.getKey();
                    double weight = entry.getValue();
                    return new Tuple2<>(label, weight / sum);
                }).collect(Collectors.toMap(Tuple2::_1, Tuple2::_2));
            });
            vertices = new_vertices;
        }
        return vertices;
    }

    static JavaPairRDD<String, Map<String, Double>> userDistributions(
            JavaPairRDD<String, Map<String, Double>> vertices) {
        JavaPairRDD<String, Map<String, Double>> user_distributions = vertices.flatMapToPair(
                (PairFlatMapFunction<Tuple2<String, Map<String, Double>>, String, Map<String, Double>>) vertex -> {
                    if (!vertex._1().startsWith("post")) {
                        return Collections.emptyIterator();
                    }
                    String post = vertex._1().substring(4);
                    Map<String, Double> L_v = vertex._2();
                    List<Tuple2<String, Map<String, Double>>> ret = new ArrayList<>();
                    for (Map.Entry<String, Double> entry : L_v.entrySet()) {
                        String user = entry.getKey();
                        Double weight = entry.getValue();
                        Map<String, Double> temp = new HashMap<>();
                        temp.put(post, weight);
                        ret.add(new Tuple2<>(user, temp));
                    }
                    return ret.iterator();
                }).reduceByKey((u1, u2) -> {
                    Map<String, Double> u = new HashMap<>();
                    for (Map.Entry<String, Double> entry : u1.entrySet()) {
                        u.put(entry.getKey(), u.getOrDefault(entry.getKey(), 0.0) + entry.getValue());
                    }
                    for (Map.Entry<String, Double> entry : u2.entrySet()) {
                        u.put(entry.getKey(), u.getOrDefault(entry.getKey(), 0.0) + entry.getValue());
                    }
                    return u;
                }).mapValues(u -> {
                    double sum = u.values().stream().mapToDouble(Double::doubleValue).sum();
                    return u.entrySet().stream().map(entry -> {
                        String post = entry.getKey();
                        double weight = entry.getValue();
                        return new Tuple2<>(post, weight / sum);
                    }).collect(Collectors.toMap(Tuple2::_1, Tuple2::_2));
                });
        return user_distributions;
    }

    static JavaPairRDD<String, Map<String, Double>> friendRecommendations(
            JavaPairRDD<String, Map<String, Double>> vertices, Dataset<Row> friends) {
        JavaPairRDD<Tuple2<String, String>, String> user_user_edges = friends.toJavaRDD().flatMapToPair(row -> {
            String user_id1_str = row.getAs("follower") + "";
            String user_id2_str = row.getAs("followed") + "";
            if (user_id1_str.equals(user_id2_str)) {
                return Collections.emptyIterator();
            }

            List<Tuple2<Tuple2<String, String>, String>> edges = new ArrayList<>();
            edges.add(new Tuple2<>(new Tuple2<>(user_id1_str, user_id2_str), ""));
            edges.add(new Tuple2<>(new Tuple2<>(user_id2_str, user_id1_str), ""));
            return edges.iterator();
        });

        JavaPairRDD<String, Map<String, Double>> friend_recommendations = vertices.flatMapToPair(vertex -> {
            if (!vertex._1().startsWith("user")) {
                return Collections.emptyIterator();
            }
            String user = vertex._1().substring(4);
            List<Tuple2<Tuple2<String, String>, Double>> ret = new ArrayList<>();
            for (Map.Entry<String, Double> entry : vertex._2().entrySet()) {
                String label = entry.getKey();
                double weight = entry.getValue();
                if (user.equals(label))
                    continue;
                ret.add(new Tuple2<>(new Tuple2<>(user, label), weight));
            }
            return ret.iterator();
        }).subtractByKey(user_user_edges).mapToPair(entry -> {
            Map<String, Double> L_u = new HashMap<>();
            L_u.put(entry._1()._2(), entry._2());
            return new Tuple2<>(entry._1()._1(), L_u);
        }).reduceByKey((u1, u2) -> {
            Map<String, Double> u = new HashMap<>();
            for (Map.Entry<String, Double> entry : u1.entrySet()) {
                u.put(entry.getKey(), u.getOrDefault(entry.getKey(), 0.0) + entry.getValue());
            }
            for (Map.Entry<String, Double> entry : u2.entrySet()) {
                u.put(entry.getKey(), u.getOrDefault(entry.getKey(), 0.0) + entry.getValue());
            }
            return u;
        }).mapValues(u -> {
            double sum = u.values().stream().mapToDouble(Double::doubleValue).sum();
            return u.entrySet().stream().map(entry -> {
                String label = entry.getKey();
                double weight = entry.getValue();
                return new Tuple2<>(label, weight / sum);
            });
        }).mapValues(u -> u.collect(Collectors.toMap(Tuple2::_1, Tuple2::_2)));
        return friend_recommendations;
    }

    /**
     * Graceful shutdown
     */
    public void shutdown() {
        logger.info("Shutting down");

        if (spark != null) {
            spark.close();
        }
    }

    public static void main(String[] args) {
        final FriendsOfFriendsSpark fofs = new FriendsOfFriendsSpark();
        try {
            fofs.initialize();
            fofs.run();
        } catch (final IOException ie) {
            logger.error("IO error occurred: " + ie.getMessage(), ie);
        } catch (final InterruptedException e) {
            logger.error("Interrupted: " + e.getMessage(), e);
        } finally {
            fofs.shutdown();
        }
    }
}
