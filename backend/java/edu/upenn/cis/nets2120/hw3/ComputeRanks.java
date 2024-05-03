package edu.upenn.cis.nets2120.hw3;

import java.io.IOException;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;

import edu.upenn.cis.nets2120.config.Config;

import scala.Tuple2;

import java.util.*;
import java.lang.Math;

public class ComputeRanks extends SparkJob<List<Tuple2<String, Double>>> {
    /**
     * The basic logger
     */
    static Logger logger = LogManager.getLogger(ComputeRanks.class);

    // Convergence condition variables
    protected double d_max; // largest change in a node's rank from iteration i to iteration i+1
    protected int i_max; // max number of iterations
    int max_answers = 1000;

    public ComputeRanks(double d_max, int i_max, int answers, boolean debug) {
        super(true, true, debug);
        this.d_max = d_max;
        this.i_max = i_max;
        this.max_answers = answers;
    }

    /**
     * Fetch the social network from the S3 path, and create a (followed, follower)
     * edge graph
     *
     * @param filePath
     * @return JavaPairRDD: (followed: String, follower: String)
     */
    // protected JavaPairRDD<String, String> getSocialNetwork(String filePath) {
    //     JavaRDD<String> file = context.textFile(filePath, Config.PARTITIONS);

    //     // TODO Load the file filePath into an RDD (take care to handle both spaces and
    //     // tab characters as separators)
    //     JavaPairRDD<String, String> network = null;

    //     network = file.flatMapToPair(line -> {
    //         // Split by spaces and tabs
    //         String[] people = line.split("[\\t\\s]+");

    //         // Create pairs of (followed, follower)
    //         List<Tuple2<String, String>> pairs = new ArrayList<>();
    //         if (people.length == 2) {
    //             String followed = people[0];
    //             String follower = people[1];

    //             pairs.add(new Tuple2<>(followed, follower));
    //         }

    //         return pairs.iterator();
    //     });

    //     return network;
    // }

    // /**
    //  * Retrieves the sinks in the provided graph.
    //  *
    //  * @param network The input graph represented as a JavaPairRDD.
    //  * @return A JavaRDD containing the nodes with no outgoing edges.
    //  */
    // protected JavaRDD<String> getSinks(JavaPairRDD<String, String> network) {
    //     // TODO Find the sinks in the provided graph
    //     return network.values().subtract(network.keys()).distinct();
    // }

    // /**
    //  * Main functionality in the program: read and process the social network
    //  * Runs the SocialRank algorithm to compute the ranks of nodes in a social
    //  * network.
    //  *
    //  * @param debug a boolean value indicating whether to enable debug mode
    //  * @return a list of tuples containing the node ID and its corresponding
    //  *         SocialRank value
    //  * @throws IOException          if there is an error reading the social network
    //  *                              data
    //  * @throws InterruptedException if the execution is interrupted
    //  */
    // public List<Tuple2<String, Double>> run(boolean debug) throws IOException, InterruptedException {

    //     // Load the social network, aka. the edges (followed, follower)
    //     JavaPairRDD<String, String> edgeRDD = getSocialNetwork(Config.SOCIAL_NET_PATH);

    //     // Find the sinks in edgeRDD as PairRDD
    //     JavaRDD<String> sinks = getSinks(edgeRDD);
    //     logger.info("There are {} sinks", sinks.count());
    //     // logger.info("There are {} edges in the graph", edgeRDD.count());

    //     // Add backlinks
    //     JavaPairRDD<String, String> reversedGraph = edgeRDD.mapToPair(x -> new Tuple2<>(x._2(), x._1()));
    //     JavaPairRDD<String, String> newEdges = reversedGraph.join(sinks.mapToPair(x -> new Tuple2<>(x, null)))
    //             .mapToPair(x -> new Tuple2<>(x._1(), x._2()._1()));
    //     JavaPairRDD<String, String> newGraph = edgeRDD.union(newEdges).distinct();

    //     // Initialize the social rank of each node to 1.0
    //     double decayFactor = 0.15;
    //     JavaPairRDD<String, Double> ranks = newGraph
    //             .keys()
    //             .distinct()
    //             .mapToPair(x -> new Tuple2<>(x, 1.0));

    //     double largestChange = 100.0;
    //     int iterations = 0;
    //     reversedGraph = newGraph.mapToPair(x -> new Tuple2<>(x._2(), x._1()));

    //     // Calculate the out degrees for each node in the graph
    //     JavaPairRDD<String, Integer> outDegrees = newGraph
    //             .mapToPair(x -> new Tuple2<>(x._1(), 1))
    //             .reduceByKey((x, y) -> x + y);

    //     // logger.info("Out degrees: {}", outDegrees.collect());
    //     // System.out.println("d max:" + this.d_max);

    //     // While loop
    //     while (largestChange >= this.d_max && iterations < this.i_max) {
    //         // System.out.println();
    //         // System.out.println();
    //         // System.out.println();
    //         // System.out.println("Iteration: " + iterations);
    //         // Increment iterations
    //         iterations += 1;

    //         // Forward the ranks
    //         JavaPairRDD<String, Double> contributions = outDegrees.join(ranks)
    //                 .mapToPair(pair -> new Tuple2<>(pair._1(), pair._2()._2() / pair._2()._1()));

    //         // Calculate the new ranks
    //         JavaPairRDD<String, Double> delta = newGraph.groupByKey().join(contributions).flatMapToPair(pair -> {
    //             Iterable<String> neighbors = pair._2()._1();
    //             double contribution = pair._2()._2();
    //             List<Tuple2<String, Double>> result = new ArrayList<>();
    //             for (String neighbor : neighbors) {
    //                 result.add(new Tuple2<>(neighbor, contribution));
    //             }
    //             return result.iterator();
    //         });

    //         // logger.info("delta" + delta.collect());

    //         JavaPairRDD<String, Double> newRanks = delta.reduceByKey((x, y) -> x + y)
    //                 .mapValues(x -> decayFactor + (1 - decayFactor) * x);

    //         // logger.info("new ranks" + newRanks.collect());

    //         // Find the biggest change
    //         largestChange = newRanks.join(ranks).mapToDouble(pair -> Math.abs(pair._2()._1() - pair._2()._2())).max();
    //         // logger.info("largest change: " + largestChange);
    //         ranks = newRanks;
    //     }

    //     // Output the top 1000 node IDs with the highest rank values
    //     JavaPairRDD<Double, String> reversedRanks = ranks.mapToPair(x -> new Tuple2<>(x._2(), x._1()));
    //     List<Tuple2<String, Double>> top1000Reversed = reversedRanks.sortByKey(false)
    //             .mapToPair(tuple -> new Tuple2<>(tuple._2(), tuple._1()))
    //             .take(1000);
    //     return top1000Reversed;
    // }
}
