import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.sql.*;
import org.apache.spark.graphx.Edge;
import java.util.Properties;

public class SparkJob {
    static JavaPairRDD<String, Map<String, Double>> vertices(Dataset<Row> hashtags, Dataset<Row> posts,
            Dataset<Row> users) {
        JavaPairRDD<String, Map<String, Double>> vertices = hashtags.selectExpr("concat('hash', hashtag_id) AS id")
                .union(posts.selectExpr("concat('post', post_id) AS id"))
                .union(users.selectExpr("concat('user', user_id) AS id"))
                .union(users.selectExpr("concat('shadow', user_id) AS id")).toJavaRDD().map(row -> row.getAs("id"))
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
        JavaPairRDD<String, String> user_edges = users.toJavaRDD().flatMap(row -> {
            long user_id = row.getAs("user_id");
            String user_id_str = "user" + user_id;
            String hashtags = row.getAs("interests");

            List<Tuple2<String, String>> edges = new ArrayList<>();
            for (String hashtag : hashtags.substring(1, hashtags.length() - 1).split(",")) {
                edges.add(new Tuple2<>(user_id_str, "hash" + hashtag));
                edges.add(new Tuple2<>("hash" + hashtag, user_id_str));
            }
            return edges.iterator();
        });

        JavaPairRDD<String, String> hash_post_edges = posts.flatMap(row -> {
            long post_id = row.getAs("post_id");
            String post_id_str = "post" + post_id;
            String hashtags = row.getAs("interests");
            String likes = row.getAs("likes");

            List<Tuple2<String, String>> edges = new ArrayList<>();
            for (String hashtag : hashtags.substring(1, hashtags.length() - 1).split(",")) {
                edges.add(new Tuple2<>("hash" + hashtag, post_id_str));
                edges.add(new Tuple2<>(post_id_str, "hash" + hashtag));
            }
            for (String like : likes.substring(1, likes.length() - 1).split(",")) {
                edges.add(new Tuple2<>("user" + like, post_id_str));
                edges.add(new Tuple2<>(post_id_str, "user" + like));
            }
            return edges.iterator();
        });

        JavaPairRDD<String, String> user_user_edges = friends.flatMap(row -> {
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
        JavaPairRDD<String, Tuple2<String, Double>> weighted_edges = edges.groupByKey().flatMapToPair(edge -> {
            String src = edge._1();
            List<Tuple2<String, Tuple2<String, Double>>> weighted_edges = new ArrayList<>();
            List<String> dsts = edge._2().toList();
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
        });
        return weighted_edges;
    }

    static JavaPairRDD<String, Map<String, Double>> adsorption(JavaPairRDD<String, Map<String, Double>> vertices,
            JavaPairRDD<String, Tuple2<String, Double>> user_edges) {
        int iteration = 0;
        while (true || iteration++ < 15) {
            JavaPairRDD<String, Map<String, Double>> new_vertices = user_edges.join(vertices).mapToPair(edge -> {
                String v = edge._2()._1()._1();
                Tuple2<String, Double> edge_weight = edge._2()._1()._2();
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
        JavaPairRDD<String, Map<String, Double>> user_distributions = vertices.flatMapToPair(vertex -> {
            if (!vertex._1().startsWith("post")) {
                return Collections.emptyIterator();
            }
            String post = vertex._1().substring(4);
            Map<String, Double> L_v = vertex._2();
            List<Tuple2<String, Map<String, Double>>> user_distributions = new ArrayList<>();
            for (Map.Entry<String, Double> entry : L_v.entrySet()) {
                String user = entry.getKey();
                double weight = entry.getValue();
                user_distributions.add(new Tuple2<>(user, new HashMap<String, Double>() {
                    {
                        put(post, weight);
                    }
                }));
            }
            return user_distributions.iterator();
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
        JavaPairRDD<Tuple2<String, String>, String> user_user_edges = friends.flatMap(row -> {
            long user_id1 = row.getAs("follower");
            long user_id2 = row.getAs("followed");
            String user_id1_str = user_id1;
            String user_id2_str = user_id2;

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
                ret.add(new Tuple2<>(new Tuple2<>(user, label), weight));
            }
            return Collections.singleton(new Tuple2<>(user, vertex._2())).iterator();
        }).subtract(user_user_edges).mapToPair(entry -> {
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
        }).collect(Collectors.toMap(Tuple2::_1, Tuple2::_2));
        return friend_recommendations;
    }

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

        JavaPairRDD<String, Map<String, Double>> vertices = vertices(hashtags, posts, users);

        JavaPairRDD<String, Tuple2<String, Double>> user_edges = edges(hashtags, posts, users, friends);

        JavaPairRDD<String, Map<String, Double>> adsorption_vertices = adsorption(vertices, user_edges);

        JavaPairRDD<String, Map<String, Double>> userDistributions = userDistributions(adsorption_vertices);

        JavaPairRDD<String, Map<String, Double>> friendRecommendations = friendRecommendations(adsorption_vertices, friends);

        // Write data back to RDS
        userDistributions.foreach(tuple -> {
            String userId = tuple._1;
            Map<String, Double> rankDistribution = tuple._2;

            byte[] serializedRankDistribution = serializeObject(rankDistribution);

            try (Connection conn = DriverManager.getConnection(url, user, password)) {
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

            try (Connection conn = DriverManager.getConnection(url, user, password)) {
                String updateQuery = "UPDATE users SET friend_recommendation = ? WHERE user_id = ?";
                PreparedStatement preparedStatement = conn.prepareStatement(updateQuery);
                preparedStatement.setBytes(1, serializedRankDistribution);
                preparedStatement.setString(2, userId);
                preparedStatement.executeUpdate();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        });
        // Send data to Livy via API (assuming LivyClient is set up)
        LivyClient livyClient = new LivyClientBuilder().setURI("http://your-livy-host:8998").build();
        String code = "print('Data processed successfully')";
        livyClient.submit(new LivyJob(code));
        livyClient.stop(true);

        spark.stop();
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
}
