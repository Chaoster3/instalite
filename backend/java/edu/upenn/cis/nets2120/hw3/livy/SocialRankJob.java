package edu.upenn.cis.nets2120.hw3.livy;

import java.io.IOException;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;

import org.apache.livy.JobContext;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;

import edu.upenn.cis.nets2120.config.Config;
import edu.upenn.cis.nets2120.hw3.SparkJob;
import scala.Tuple2;

public class SocialRankJob extends SparkJob<List<MyPair<String, Double>>> {
    /**
     *
     */
    private static final long serialVersionUID = 1L;

    private boolean useBacklinks;
    // Convergence condition variables
    protected double d_max; // largest change in a node's rank from iteration i to iteration i+1
    protected int i_max; // max number of iterations

    private String source;

    int max_answers = 1000;

    public SocialRankJob(double d_max, int i_max, int answers, boolean useBacklinks, boolean debug) {
        super(false, false, debug);
        this.useBacklinks = useBacklinks;
        this.d_max = d_max;
        this.i_max = i_max;
        this.max_answers = answers;
    }

    // /**
    //  * Fetch the social network from the S3 path, and create a (followed, follower)
    //  * edge graph
    //  *
    //  * @param filePath
    //  * @return JavaPairRDD: (followed: String, follower: String)
    //  */
    // protected JavaPairRDD<String, String> getSocialNetwork(String filePath) {
    //     JavaRDD<String> file = context.textFile(filePath, Config.PARTITIONS);

    //     // TODO Your code from ComputeRanks here
    //     JavaPairRDD<String, String> network = null;

    //     network = file.flatMapToPair(line -> {
    //         // Split by spaces and tabs
    //         String[] people = line.split("[\\t\\s]+");

    //         // Create pairs of (followed, follower)
    //         List<Tuple2<String, String>> pairs = new LinkedList<Tuple2<String, String>>();
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
    //  * Retrieves the sinks from the given network.
    //  *
    //  * @param network the input network represented as a JavaPairRDD
    //  * @return a JavaRDD containing the nodes with no outgoing edges (sinks)
    //  */
    // protected JavaRDD<String> getSinks(JavaPairRDD<String, String> network) {
    //     // TODO Your code from ComputeRanks here
    //     return network.values().subtract(network.keys()).distinct();
    // }

    // /**
    //  * Main functionality in the program: read and process the social network
    //  * Runs the SocialRankJob and returns a list of the top 10 nodes with the
    //  * highest SocialRank values.
    //  *
    //  * @param debug a boolean indicating whether to enable debug mode
    //  * @return a list of MyPair objects representing the top 10 nodes with their
    //  *         corresponding SocialRank values
    //  * @throws IOException          if there is an error reading the social network
    //  *                              file
    //  * @throws InterruptedException if the execution is interrupted
    //  */
    // public List<MyPair<String, Double>> run(boolean debug) throws IOException, InterruptedException {
    //     System.out.println("Running");

    //     // Load the social network, aka. the edges (followed, follower)
    //     JavaPairRDD<String, String> edgeRDD = getSocialNetwork(Config.SOCIAL_NET_PATH);

    //     // Find the sinks in edgeRDD as PairRDD
    //     JavaRDD<String> sinks = getSinks(edgeRDD);

    //     // TODO: Your code from ComputeRanks here
    //     JavaPairRDD<String, String> reversedGraph = edgeRDD.mapToPair(x -> new Tuple2<>(x._2(), x._1()));
    //     JavaPairRDD<String, String> newEdges = reversedGraph.join(sinks.mapToPair(x -> new Tuple2<>(x, null)))
    //             .mapToPair(x -> new Tuple2<>(x._1(), x._2()._1()));

    //     JavaPairRDD<String, String> newGraph;
    //     if (useBacklinks) {
    //         newGraph = edgeRDD.union(newEdges).distinct();
    //     } else {
    //         newGraph = edgeRDD.distinct();
    //     }

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

    //     // While loop
    //     while (largestChange >= this.d_max && iterations < this.i_max) {
    //         // Increment iterations
    //         iterations += 1;

    //         // Forward the ranks
    //         JavaPairRDD<String, Double> contributions = outDegrees.join(ranks)
    //                 .mapToPair(pair -> new Tuple2<>(pair._1(), pair._2()._2() / pair._2()._1()));

    //         // Calculate the new ranks
    //         JavaPairRDD<String, Double> delta = newGraph.groupByKey().join(contributions).flatMapToPair(pair -> {
    //             Iterable<String> neighbors = pair._2()._1();
    //             double contribution = pair._2()._2();
    //             List<Tuple2<String, Double>> result = new LinkedList<Tuple2<String, Double>>();
    //             for (String neighbor : neighbors) {
    //                 result.add(new Tuple2<>(neighbor, contribution));
    //             }
    //             return result.iterator();
    //         });

    //         JavaPairRDD<String, Double> newRanks = delta.reduceByKey((x, y) -> x + y)
    //                 .mapValues(x -> decayFactor + (1 - decayFactor) * x);
    //         ;

    //         // Find the biggest change
    //         largestChange = newRanks.join(ranks).mapToDouble(pair -> Math.abs(pair._2()._1() - pair._2()._2())).max();
    //         ranks = newRanks;
    //     }

    //     // Output the top 1000 node IDs with the highest rank values
    //     JavaPairRDD<Double, String> reversedRanks = ranks.mapToPair(x -> new Tuple2<>(x._2(), x._1()));
    //     List<Tuple2<String, Double>> top1000Reversed = reversedRanks.sortByKey(false)
    //             .mapToPair(tuple -> new Tuple2<>(tuple._2(), tuple._1()))
    //             .take(10);

    //     List<MyPair<String, Double>> top1000 = new LinkedList<MyPair<String, Double>>();

    //     for (Tuple2<String, Double> item : top1000Reversed) {
    //         String key = item._1();
    //         Double value = item._2();

    //         top1000.add(new MyPair<String, Double>(key, value));
    //     }
    //     return top1000;
    // }

    // @Override
    // public List<MyPair<String, Double>> call(JobContext arg0) throws Exception {
    //     initialize();
    //     return run(false);
    // }

}
