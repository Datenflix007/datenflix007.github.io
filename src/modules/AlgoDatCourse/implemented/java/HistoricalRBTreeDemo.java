import javax.swing.BorderFactory;
import javax.swing.DefaultListModel;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JList;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.ListSelectionModel;
import javax.swing.SwingUtilities;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class HistoricalRBTreeDemo {
    /*
     * TreeMap ist in Java als Rot-Schwarz-Baum implementiert.
     * Die UI arbeitet also auf einer echten sortierten Baumstruktur.
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
        return next == null || next.getValue().isEmpty() ? null : next.getValue().get(0);
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            HistoricalRBTreeDemo database = seededDatabase();
            HistoricalDatabaseFrame frame = new HistoricalDatabaseFrame(database);
            frame.setVisible(true);
        });
    }

    private static HistoricalRBTreeDemo seededDatabase() {
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

        return db;
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
            String span = startDate.equals(endDate)
                    ? startDate.toString()
                    : startDate + " bis " + endDate;
            return span + "  |  " + title;
        }

        String details() {
            return title + "\n"
                    + "Zeitraum: " + startDate + " bis " + endDate + "\n"
                    + "Personen: " + String.join(", ", people) + "\n"
                    + "Dokumente: " + String.join(", ", documents);
        }
    }

    static class HistoricalDatabaseFrame extends JFrame {
        private final HistoricalRBTreeDemo database;
        private final DefaultListModel<HistoricalEntry> listModel = new DefaultListModel<>();
        private final JList<HistoricalEntry> entryList = new JList<>(listModel);
        private final TimelinePanel timelinePanel = new TimelinePanel();
        private final JTextArea detailsArea = new JTextArea();

        private final JTextField fromField = new JTextField("1789-01-01", 10);
        private final JTextField toField = new JTextField("1800-01-01", 10);
        private final JTextField startField = new JTextField("1804-12-02", 10);
        private final JTextField endField = new JTextField("1804-12-02", 10);
        private final JTextField titleField = new JTextField("Krönung Napoleons", 18);
        private final JTextField peopleField = new JTextField("Napoleon Bonaparte, Josephine", 22);
        private final JTextField docsField = new JTextField("docs/coronation.pdf", 22);

        HistoricalDatabaseFrame(HistoricalRBTreeDemo database) {
            super("Historische Datenbank mit Rot-Schwarz-Baum");
            this.database = database;

            setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            setSize(980, 680);
            setLocationRelativeTo(null);
            setLayout(new BorderLayout(12, 12));

            add(buildQueryPanel(), BorderLayout.NORTH);
            add(buildMainPanel(), BorderLayout.CENTER);
            add(buildInputPanel(), BorderLayout.SOUTH);

            entryList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
            entryList.addListSelectionListener(event -> {
                HistoricalEntry entry = entryList.getSelectedValue();
                detailsArea.setText(entry == null ? "" : entry.details());
            });

            refreshResults();
        }

        private JPanel buildQueryPanel() {
            JPanel panel = new JPanel(new GridBagLayout());
            panel.setBorder(BorderFactory.createEmptyBorder(12, 12, 0, 12));

            GridBagConstraints c = constraints();
            panel.add(new JLabel("Von"), c);
            c.gridx++;
            panel.add(fromField, c);
            c.gridx++;
            panel.add(new JLabel("Bis"), c);
            c.gridx++;
            panel.add(toField, c);
            c.gridx++;

            JButton searchButton = new JButton("Bereich suchen");
            searchButton.addActionListener(event -> refreshResults());
            panel.add(searchButton, c);
            c.gridx++;

            JButton nextButton = new JButton("Nächster Eintrag");
            nextButton.addActionListener(event -> showNextEntry());
            panel.add(nextButton, c);

            return panel;
        }

        private JPanel buildMainPanel() {
            JPanel panel = new JPanel(new BorderLayout(12, 12));
            panel.setBorder(BorderFactory.createEmptyBorder(0, 12, 0, 12));

            JScrollPane listScroll = new JScrollPane(entryList);
            listScroll.setPreferredSize(new Dimension(360, 240));
            listScroll.setBorder(BorderFactory.createTitledBorder("Gefundene Einträge"));
            panel.add(listScroll, BorderLayout.WEST);

            JPanel center = new JPanel(new BorderLayout(8, 8));
            timelinePanel.setBorder(BorderFactory.createTitledBorder("Zeitstrahl"));
            center.add(timelinePanel, BorderLayout.CENTER);

            detailsArea.setEditable(false);
            detailsArea.setLineWrap(true);
            detailsArea.setWrapStyleWord(true);
            detailsArea.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 13));
            JScrollPane detailsScroll = new JScrollPane(detailsArea);
            detailsScroll.setPreferredSize(new Dimension(300, 120));
            detailsScroll.setBorder(BorderFactory.createTitledBorder("Details"));
            center.add(detailsScroll, BorderLayout.SOUTH);

            panel.add(center, BorderLayout.CENTER);
            return panel;
        }

        private JPanel buildInputPanel() {
            JPanel panel = new JPanel(new GridBagLayout());
            panel.setBorder(BorderFactory.createTitledBorder("Neuen Eintrag einfügen"));

            GridBagConstraints c = constraints();
            panel.add(new JLabel("Start"), c);
            c.gridx++;
            panel.add(startField, c);
            c.gridx++;
            panel.add(new JLabel("Ende"), c);
            c.gridx++;
            panel.add(endField, c);
            c.gridx++;
            panel.add(new JLabel("Titel"), c);
            c.gridx++;
            panel.add(titleField, c);

            c.gridx = 0;
            c.gridy = 1;
            panel.add(new JLabel("Personen"), c);
            c.gridx++;
            c.gridwidth = 3;
            panel.add(peopleField, c);
            c.gridx += 3;
            c.gridwidth = 1;
            panel.add(new JLabel("Dokumente"), c);
            c.gridx++;
            panel.add(docsField, c);
            c.gridx++;

            JButton addButton = new JButton("Einfügen");
            addButton.addActionListener(event -> addEntryFromForm());
            panel.add(addButton, c);

            return panel;
        }

        private GridBagConstraints constraints() {
            GridBagConstraints c = new GridBagConstraints();
            c.gridx = 0;
            c.gridy = 0;
            c.insets = new Insets(4, 6, 4, 6);
            c.fill = GridBagConstraints.HORIZONTAL;
            return c;
        }

        private void addEntryFromForm() {
            try {
                HistoricalEntry entry = new HistoricalEntry(
                        LocalDate.parse(startField.getText().trim()),
                        LocalDate.parse(endField.getText().trim()),
                        titleField.getText().trim(),
                        splitList(peopleField.getText()),
                        splitList(docsField.getText())
                );
                database.add(entry);
                refreshResults();
                entryList.setSelectedValue(entry, true);
            } catch (DateTimeParseException ex) {
                JOptionPane.showMessageDialog(this, "Bitte Datum im Format YYYY-MM-DD eingeben.");
            }
        }

        private List<String> splitList(String text) {
            List<String> values = new ArrayList<>();
            for (String part : text.split(",")) {
                String trimmed = part.trim();
                if (!trimmed.isEmpty()) {
                    values.add(trimmed);
                }
            }
            return values;
        }

        private void refreshResults() {
            try {
                LocalDate from = LocalDate.parse(fromField.getText().trim());
                LocalDate to = LocalDate.parse(toField.getText().trim());
                List<HistoricalEntry> entries = database.activeDuring(from, to);

                listModel.clear();
                for (HistoricalEntry entry : entries) {
                    listModel.addElement(entry);
                }
                timelinePanel.setRange(from, to, entries);
                if (!entries.isEmpty()) {
                    entryList.setSelectedIndex(0);
                } else {
                    detailsArea.setText("");
                }
            } catch (DateTimeParseException ex) {
                JOptionPane.showMessageDialog(this, "Bitte Suchzeitraum im Format YYYY-MM-DD eingeben.");
            }
        }

        private void showNextEntry() {
            try {
                LocalDate from = LocalDate.parse(fromField.getText().trim());
                HistoricalEntry next = database.nextAfter(from);
                detailsArea.setText(next == null ? "Kein späterer Eintrag vorhanden." : next.details());
                if (next != null) {
                    entryList.setSelectedValue(next, true);
                }
            } catch (DateTimeParseException ex) {
                JOptionPane.showMessageDialog(this, "Bitte Startdatum im Format YYYY-MM-DD eingeben.");
            }
        }
    }

    static class TimelinePanel extends JPanel {
        private LocalDate from = LocalDate.of(1789, 1, 1);
        private LocalDate to = LocalDate.of(1800, 1, 1);
        private List<HistoricalEntry> entries = List.of();

        TimelinePanel() {
            setPreferredSize(new Dimension(520, 360));
            setBackground(Color.WHITE);
        }

        void setRange(LocalDate from, LocalDate to, List<HistoricalEntry> entries) {
            this.from = from;
            this.to = to;
            this.entries = List.copyOf(entries);
            repaint();
        }

        @Override
        protected void paintComponent(Graphics graphics) {
            super.paintComponent(graphics);
            Graphics2D g = (Graphics2D) graphics;
            int left = 50;
            int right = getWidth() - 30;
            int top = 40;
            int rowHeight = 46;
            long totalDays = Math.max(1, to.toEpochDay() - from.toEpochDay());

            g.setColor(new Color(40, 40, 40));
            g.drawLine(left, top, right, top);
            g.drawString(from.toString(), left, top - 10);
            g.drawString(to.toString(), Math.max(left, right - 90), top - 10);

            for (int i = 0; i < entries.size(); i++) {
                HistoricalEntry entry = entries.get(i);
                int y = top + 32 + i * rowHeight;
                int x1 = position(entry.startDate, left, right, totalDays);
                int x2 = position(entry.endDate, left, right, totalDays);

                g.setColor(new Color(178, 34, 34));
                g.fillRoundRect(Math.min(x1, x2), y - 8, Math.max(8, Math.abs(x2 - x1) + 8), 12, 8, 8);
                g.setColor(new Color(25, 25, 25));
                g.drawString(entry.title, left, y + 16);
            }
        }

        private int position(LocalDate date, int left, int right, long totalDays) {
            long offset = Math.max(0, Math.min(totalDays, date.toEpochDay() - from.toEpochDay()));
            return left + (int) ((offset * (right - left)) / totalDays);
        }
    }
}
