package edu.upenn.cis.nets2120.hw3.livy;

import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintStream;
import java.net.URISyntaxException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import edu.upenn.cis.nets2120.hw3.SparkJob;
import scala.Tuple2;

/**
 * The `ComputeRanksLivy` class is responsible for running a social network ranking job using Apache Livy.
 * It takes command line arguments to configure the job parameters and performs the following tasks:
 * 1. Runs a SocialRankJob with backlinks set to true and writes the output to a file named "socialrank-livy-backlinks.csv".
 * 2. Runs a SocialRankJob with backlinks set to false and writes the output to a file named "socialrank-livy-nobacklinks.csv".
 * 3. Compares the top-10 results from both runs and writes the comparison to a file named "socialrank-livy-results.txt".
 * <p>
 * The class uses the Apache Livy library to submit and execute the jobs on a Livy server.
 * It also uses the SparkJob class to run the SocialRankJob and obtain the results.
 * <p>
 * To run the job, the `LIVY_HOST` environment variable must be set. If not set, the program will exit with an error message.
 */
public class ComputeRanksLivy {
    static Logger logger = LogManager.getLogger(ComputeRanksLivy.class);

    public static void main(String[] args)
            throws IOException, URISyntaxException, InterruptedException, ExecutionException {
        // Check so we'll fatally exit if the environment isn't set
        if (System.getenv("LIVY_HOST") == null) {
            logger.error("LIVY_HOST not set -- update your .env and run source .env");
            System.exit(-1);
        }
        String livy = SparkJob.getLivyUrl(args);
        AdsorptionJob blJob = new AdsorptionJob();

        SparkJob.runJob(livy, blJob);
    }

}
