import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class HistoricalRBTreeDemo {
    /*
     * TreeMap ist in Java als Rot-Schwarz-Baum implementiert.
     * Die Schlüssel bleiben sortiert, range queries laufen über subMap().
     */
    private final TreeMap<LocalDate, List<HistoricalEntry>> byStartDate = new TreeMap<>();

    public void add(HistoricalEntry entry) {
        byStartDate.computeIfAbsent(entry.startDate, ignored -> new ArrayList<>()).add(entry);
    }

    public List<HistoricalEntry> between(LocalDate from, LocalDate to) {
        List<HistoricalEntry> result = new ArrayList<>();

        for (List<HistoricalEntry> entries : byStartDate.subMap(from, true, to, true).values()) {
            result.addAll(entries);
        }

        return result;
    }

    public List<HistoricalEntry> activeDuring(LocalDate from, LocalDate to) {
        List<HistoricalEntry> result = new ArrayList<>();

        for (List<HistoricalEntry> entries : byStartDate.headMap(to, true).values()) {
            for (HistoricalEntry entry : entries) {
                if (!entry.endDate.isBefore(from)) {
                    result.add(entry);
                }
            }
        }

        return result;
    }

    public HistoricalEntry nextAfter(LocalDate date) {
        Map.Entry<LocalDate, List<HistoricalEntry>> next = byStartDate.ceilingEntry(date);
        if (next == null || next.getValue().isEmpty()) {
            return null;
        }
        return next.getValue().get(0);
    }

    public void printTimeline(LocalDate from, LocalDate to) {
        System.out.println("Zeitstrahl " + from + " bis " + to);
        System.out.println("------------------------------------------------------------");

        for (HistoricalEntry entry : activeDuring(from, to)) {
            System.out.printf("%s  %s%n", bar(entry, from, to, 36), entry.title);
            System.out.printf("      Personen:  %s%n", String.join(", ", entry.people));
            System.out.printf("      Dokumente: %s%n%n", String.join(", ", entry.documents));
        }
    }

    private String bar(HistoricalEntry entry, LocalDate from, LocalDate to, int width) {
        long totalDays = Math.max(1, to.toEpochDay() - from.toEpochDay());
        long startOffset = Math.max(0, entry.startDate.toEpochDay() - from.toEpochDay());
        long endOffset = Math.min(totalDays, entry.endDate.toEpochDay() - from.toEpochDay());

        int start = (int) ((startOffset * width) / totalDays);
        int end = Math.max(start, (int) ((endOffset * width) / totalDays));

        StringBuilder line = new StringBuilder("[");
        for (int i = 0; i < width; i++) {
            line.append(i >= start && i <= end ? '=' : ' ');
        }
        line.append("] ");
        line.append(entry.startDate);
        if (!entry.startDate.equals(entry.endDate)) {
            line.append(" -> ").append(entry.endDate);
        }
        return line.toString();
    }

    public static void main(String[] args) {
        HistoricalRBTreeDemo db = new HistoricalRBTreeDemo();

        db.add(new HistoricalEntry(
                LocalDate.of(1789, 7, 14),
                LocalDate.of(1789, 7, 14),
                "Sturm auf die Bastille",
                List.of("Camille Desmoulins", "Pariser Nationalgarde"),
                List.of("docs/bastille_bericht.pdf", "images/bastille.jpg")
        ));

        db.add(new HistoricalEntry(
                LocalDate.of(1789, 8, 26),
                LocalDate.of(1789, 8, 26),
                "Erklärung der Menschen- und Bürgerrechte",
                List.of("Nationalversammlung", "Marquis de Lafayette"),
                List.of("docs/declaration_1789.pdf")
        ));

        db.add(new HistoricalEntry(
                LocalDate.of(1792, 9, 21),
                LocalDate.of(1799, 11, 9),
                "Erste Französische Republik",
                List.of("Nationalkonvent", "Napoleon Bonaparte"),
                List.of("docs/republic_timeline.md", "archive/republic_sources.zip")
        ));

        db.add(new HistoricalEntry(
                LocalDate.of(1799, 11, 9),
                LocalDate.of(1799, 11, 10),
                "Staatsstreich des 18. Brumaire",
                List.of("Napoleon Bonaparte", "Emmanuel Joseph Sieyes"),
                List.of("docs/brumaire_notes.pdf")
        ));

        System.out.println("Einträge zwischen 1789-07-01 und 1789-12-31:");
        for (HistoricalEntry entry : db.between(LocalDate.of(1789, 7, 1), LocalDate.of(1789, 12, 31))) {
            System.out.println("- " + entry);
        }

        System.out.println();
        System.out.println("Nächster Eintrag ab 1790-01-01:");
        System.out.println(db.nextAfter(LocalDate.of(1790, 1, 1)));

        System.out.println();
        db.printTimeline(LocalDate.of(1789, 1, 1), LocalDate.of(1800, 1, 1));
    }

    static class HistoricalEntry {
        final LocalDate startDate;
        final LocalDate endDate;
        final String title;
        final List<String> people;
        final List<String> documents;

        HistoricalEntry(LocalDate startDate, LocalDate endDate, String title,
                        List<String> people, List<String> documents) {
            this.startDate = startDate;
            this.endDate = endDate;
            this.title = title;
            this.people = List.copyOf(people);
            this.documents = List.copyOf(documents);
        }

        @Override
        public String toString() {
            return startDate + " bis " + endDate + ": " + title
                    + " | Personen=" + people
                    + " | Dokumente=" + documents;
        }
    }
}
