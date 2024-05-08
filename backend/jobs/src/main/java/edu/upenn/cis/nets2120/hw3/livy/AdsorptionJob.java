package edu.upenn.cis.nets2120.hw3.livy;

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

import org.apache.livy.JobContext;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.function.PairFlatMapFunction;
import org.apache.spark.sql.SparkSession;

import edu.upenn.cis.nets2120.config.Config;
import edu.upenn.cis.nets2120.hw3.SparkJob;
import scala.Tuple2;

public class AdsorptionJob extends SparkJob<String> {
    /**
     *
     */
    private static final long serialVersionUID = 1L;

    int max_answers = 1000;

    public AdsorptionJob() {
        super(false, false, false);
    }

    /**
     * Main functionality in the program: read and process the social network
     * Runs the SocialRankJob and returns a list of the top 10 nodes with the
     * highest SocialRank values.
     *
     * @param debug a boolean indicating whether to enable debug mode
     * @return a list of MyPair objects representing the top 10 nodes with their
     *         corresponding SocialRank values
     * @throws IOException          if there is an error reading the social network
     *                              file
     * @throws InterruptedException if the execution is interrupted
     */
    public String run(boolean debug) throws IOException, InterruptedException {
        System.out.println("Running");
        Dotenv dotenv = Dotenv.configure().load();

        // Access variables
        String dbUser = dotenv.get("RDS_USER");
        String dbPassword = dotenv.get("RDS_PWD");
        String rdsHost = dotenv.get("RDS_HOST");
        String rdsPort = dotenv.get("RDS_PORT");

        SparkSession spark = SparkSession.builder()
                .appName("SparkJob")
                .getOrCreate();

        // Define JDBC connection properties
        String url = "jdbc:mysql://" + rdsHost + ":" + rdsPort + "/pennstagram";
        Properties connectionProperties = new Properties();
        connectionProperties.setProperty("user", dbUser);
        connectionProperties.setProperty("password", dbPassword);

        // Read data from RDS
        Dataset<Row> hashtags = spark.read().jdbc(url, "hashtags", connectionProperties);
        Dataset<Row> posts = spark.read().jdbc(url, "posts", connectionProperties);
        Dataset<Row> users = spark.read().jdbc(url, "users", connectionProperties);
        Dataset<Row> friends = spark.read().jdbc(url, "friends", connectionProperties);

        JavaPairRDD<String, Map<String, Double>> vertices = vertices(hashtags, posts, users);

        JavaPairRDD<String, Tuple2<String, Double>> user_edges = edges(hashtags, posts, users, friends);

        JavaPairRDD<String, Map<String, Double>> adsorption_vertices = adsorption(vertices, user_edges);

        JavaPairRDD<String, Map<String, Double>> userDistributions = userDistributions(adsorption_vertices);

        JavaPairRDD<String, Map<String, Double>> friendRecommendations = friendRecommendations(adsorption_vertices,
                friends);

        // Write data back to RDS
        userDistributions.foreach(tuple -> {
            String userId = tuple._1;
            Map<String, Double> rankDistribution = tuple._2;

            byte[] serializedRankDistribution = serializeObject(rankDistribution);

            try (Connection conn = DriverManager.getConnection(url, dbUser, dbPassword)) {
                String updateQuery = "UPDATE users SET rank_distribution = ? WHERE user_id = ?";
                PreparedStatement preparedStatement = conn.prepareStatement(updateQuery);
                preparedStatement.setBytes(1, serializedRankDistribution);
                preparedStatement.setString(2, userId);
                preparedStatement.executeUpdate();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        });

        friendRecommendations.foreach(tuple -> {
            String userId = tuple._1;
            Map<String, Double> rankDistribution = tuple._2;

            byte[] serializedRankDistribution = serializeObject(rankDistribution);

            try (Connection conn = DriverManager.getConnection(url, dbUser, dbPassword)) {
                String updateQuery = "UPDATE users SET friend_recommendation = ? WHERE user_id = ?";
                PreparedStatement preparedStatement = conn.prepareStatement(updateQuery);
                preparedStatement.setBytes(1, serializedRankDistribution);
                preparedStatement.setString(2, userId);
                preparedStatement.executeUpdate();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        });
        return "Success";
    }

    @Override
    public String call(JobContext arg0) throws Exception {
        initialize();
        return run(false);
    }

    private static byte[] serializeObject(Object obj) {
        try {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            ObjectOutputStream oos = new ObjectOutputStream(bos);
            oos.writeObject(obj);
            oos.flush();
            byte[] bytes = bos.toByteArray();
            bos.close();
            oos.close();
            return bytes;
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
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
            long user_id = row.getAs("user_id");
            String user_id_str = "user" + user_id;
            String interests = (String) row.getAs("interests");

            List<Tuple2<String, String>> edges = new ArrayList<>();
            for (String hashtag : interests.substring(1, interests.length() - 1).split(",")) {
                edges.add(new Tuple2<>(user_id_str, "hash" + hashtag));
                edges.add(new Tuple2<>("hash" + hashtag, user_id_str));
            }
            return edges.iterator();
        });

        JavaPairRDD<String, String> hash_post_edges = posts.toJavaRDD().flatMapToPair(row -> {
            long post_id = row.getAs("post_id");
            String post_id_str = "post" + post_id;
            String interests = row.getAs("interests");
            String likes = row.getAs("likes");

            List<Tuple2<String, String>> edges = new ArrayList<>();
            for (String hashtag : interests.substring(1, interests.length() - 1).split(",")) {
                edges.add(new Tuple2<>("hash" + hashtag, post_id_str));
                edges.add(new Tuple2<>(post_id_str, "hash" + hashtag));
            }
            for (String like : likes.substring(1, likes.length() - 1).split(",")) {
                edges.add(new Tuple2<>("user" + like, post_id_str));
                edges.add(new Tuple2<>(post_id_str, "user" + like));
            }
            return edges.iterator();
        });

        JavaPairRDD<String, String> user_user_edges = friends.toJavaRDD().flatMapToPair(row -> {
            long user_id1 = row.getAs("follower");
            long user_id2 = row.getAs("followed");
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
            String user_id1_str = row.getAs("follower");
            String user_id2_str = row.getAs("followed");
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

}
