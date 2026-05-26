import javax.swing.BorderFactory;
import javax.swing.DefaultListCellRenderer;
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
import javax.swing.UIManager;
import javax.swing.border.EmptyBorder;
import java.awt.BasicStroke;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.Polygon;
import java.awt.RenderingHints;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class HistoricalRBTreeDemo {
    private static final Color BG = new Color(246, 248, 251);
    private static final Color PANEL = Color.WHITE;
    private static final Color BORDER = new Color(221, 226, 234);
    private static final Color TEXT = new Color(31, 41, 55);
    private static final Color MUTED = new Color(107, 114, 128);
    private static final Color RED = new Color(190, 18, 60);
    private static final Color GREEN = new Color(132, 204, 22);
    private static final Color GREEN_DARK = new Color(77, 124, 15);

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
            configureLookAndFeel();
            HistoricalRBTreeDemo database = seededDatabase();
            HistoricalDatabaseFrame frame = new HistoricalDatabaseFrame(database);
            frame.setVisible(true);
        });
    }

    private static void configureLookAndFeel() {
        UIManager.put("Panel.background", BG);
        UIManager.put("Label.foreground", TEXT);
        UIManager.put("Button.background", new Color(17, 24, 39));
        UIManager.put("Button.foreground", Color.WHITE);
        UIManager.put("Button.focus", new Color(17, 24, 39));
        UIManager.put("TextField.background", Color.WHITE);
        UIManager.put("TextField.foreground", TEXT);
        UIManager.put("TextArea.background", Color.WHITE);
        UIManager.put("TextArea.foreground", TEXT);
        UIManager.put("List.background", Color.WHITE);
        UIManager.put("List.foreground", TEXT);
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
                LocalDate.of(1793, 9, 5),
                LocalDate.of(1794, 7, 27),
                "Schreckensherrschaft",
                List.of("Maximilien Robespierre", "Wohlfahrtsausschuss"),
                List.of("docs/terror_period_sources.pdf")
        ));

        db.add(new HistoricalEntry(
                LocalDate.of(1799, 11, 9),
                LocalDate.of(1799, 11, 9),
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
            this.endDate = endDate.isBefore(startDate) ? startDate : endDate;
            this.title = title;
            this.people = List.copyOf(people);
            this.documents = List.copyOf(documents);
        }

        boolean isEvent() {
            return startDate.equals(endDate);
        }

        @Override
        public String toString() {
            String kind = isEvent() ? "Ereignis" : "Prozess";
            String span = isEvent() ? startDate.toString() : startDate + " bis " + endDate;
            return kind + "  |  " + span + "  |  " + title;
        }

        String details() {
            return title + "\n"
                    + "Typ: " + (isEvent() ? "Ereignis" : "Prozess") + "\n"
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
            setSize(1120, 720);
            setMinimumSize(new Dimension(980, 620));
            setLocationRelativeTo(null);
            setLayout(new BorderLayout(14, 14));
            getContentPane().setBackground(BG);

            add(buildHeader(), BorderLayout.NORTH);
            add(buildMainPanel(), BorderLayout.CENTER);
            add(buildInputPanel(), BorderLayout.SOUTH);

            entryList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
            entryList.setCellRenderer(new EntryRenderer());
            entryList.addListSelectionListener(event -> {
                HistoricalEntry entry = entryList.getSelectedValue();
                detailsArea.setText(entry == null ? "" : entry.details());
            });

            refreshResults();
        }

        private JPanel buildHeader() {
            JPanel panel = cardPanel(new BorderLayout(16, 10));
            panel.setBorder(new EmptyBorder(18, 20, 18, 20));

            JPanel titlePanel = new JPanel(new BorderLayout(2, 2));
            titlePanel.setOpaque(false);
            JLabel title = new JLabel("Historische Datenbank");
            title.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 24));
            JLabel subtitle = new JLabel("Rot-Schwarz-Baum: Ereignisse als Fahnen, Prozesse als Zeitbalken");
            subtitle.setForeground(MUTED);
            titlePanel.add(title, BorderLayout.NORTH);
            titlePanel.add(subtitle, BorderLayout.SOUTH);
            panel.add(titlePanel, BorderLayout.WEST);

            JPanel query = new JPanel(new GridBagLayout());
            query.setOpaque(false);
            GridBagConstraints c = constraints();
            query.add(smallLabel("Von"), c);
            c.gridx++;
            query.add(styledField(fromField), c);
            c.gridx++;
            query.add(smallLabel("Bis"), c);
            c.gridx++;
            query.add(styledField(toField), c);
            c.gridx++;

            JButton searchButton = primaryButton("Bereich suchen");
            searchButton.addActionListener(event -> refreshResults());
            query.add(searchButton, c);
            c.gridx++;

            JButton nextButton = secondaryButton("Nächster Eintrag");
            nextButton.addActionListener(event -> showNextEntry());
            query.add(nextButton, c);
            panel.add(query, BorderLayout.EAST);

            return panel;
        }

        private JPanel buildMainPanel() {
            JPanel panel = new JPanel(new BorderLayout(14, 14));
            panel.setOpaque(false);
            panel.setBorder(new EmptyBorder(0, 16, 0, 16));

            JScrollPane listScroll = new JScrollPane(entryList);
            listScroll.setPreferredSize(new Dimension(390, 260));
            listScroll.setBorder(BorderFactory.createTitledBorder(BorderFactory.createLineBorder(BORDER), "Einträge"));
            panel.add(listScroll, BorderLayout.WEST);

            JPanel center = new JPanel(new BorderLayout(12, 12));
            center.setOpaque(false);
            JPanel timelineCard = cardPanel(new BorderLayout());
            timelineCard.setBorder(new EmptyBorder(12, 12, 12, 12));
            timelineCard.add(timelinePanel, BorderLayout.CENTER);
            center.add(timelineCard, BorderLayout.CENTER);

            detailsArea.setEditable(false);
            detailsArea.setLineWrap(true);
            detailsArea.setWrapStyleWord(true);
            detailsArea.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 13));
            detailsArea.setBorder(new EmptyBorder(10, 12, 10, 12));
            JScrollPane detailsScroll = new JScrollPane(detailsArea);
            detailsScroll.setPreferredSize(new Dimension(300, 128));
            detailsScroll.setBorder(BorderFactory.createTitledBorder(BorderFactory.createLineBorder(BORDER), "Details"));
            center.add(detailsScroll, BorderLayout.SOUTH);

            panel.add(center, BorderLayout.CENTER);
            return panel;
        }

        private JPanel buildInputPanel() {
            JPanel panel = cardPanel(new GridBagLayout());
            panel.setBorder(BorderFactory.createTitledBorder(BorderFactory.createLineBorder(BORDER), "Neuen Eintrag einfügen"));

            GridBagConstraints c = constraints();
            panel.add(smallLabel("Start"), c);
            c.gridx++;
            panel.add(styledField(startField), c);
            c.gridx++;
            panel.add(smallLabel("Ende"), c);
            c.gridx++;
            panel.add(styledField(endField), c);
            c.gridx++;
            panel.add(smallLabel("Titel"), c);
            c.gridx++;
            panel.add(styledField(titleField), c);

            c.gridx = 0;
            c.gridy = 1;
            panel.add(smallLabel("Personen"), c);
            c.gridx++;
            c.gridwidth = 3;
            panel.add(styledField(peopleField), c);
            c.gridx += 3;
            c.gridwidth = 1;
            panel.add(smallLabel("Dokumente"), c);
            c.gridx++;
            panel.add(styledField(docsField), c);
            c.gridx++;

            JButton addButton = primaryButton("Einfügen");
            addButton.addActionListener(event -> addEntryFromForm());
            panel.add(addButton, c);

            JPanel outer = new JPanel(new BorderLayout());
            outer.setOpaque(false);
            outer.setBorder(new EmptyBorder(0, 16, 16, 16));
            outer.add(panel, BorderLayout.CENTER);
            return outer;
        }

        private JPanel cardPanel(java.awt.LayoutManager layout) {
            JPanel panel = new JPanel(layout);
            panel.setBackground(PANEL);
            panel.setBorder(BorderFactory.createCompoundBorder(
                    BorderFactory.createLineBorder(BORDER),
                    new EmptyBorder(10, 12, 10, 12)
            ));
            return panel;
        }

        private JLabel smallLabel(String text) {
            JLabel label = new JLabel(text);
            label.setForeground(MUTED);
            label.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 12));
            return label;
        }

        private JTextField styledField(JTextField field) {
            field.setBorder(BorderFactory.createCompoundBorder(
                    BorderFactory.createLineBorder(BORDER),
                    new EmptyBorder(7, 9, 7, 9)
            ));
            return field;
        }

        private JButton primaryButton(String text) {
            JButton button = new JButton(text);
            button.setBackground(new Color(17, 24, 39));
            button.setForeground(Color.WHITE);
            button.setFocusPainted(false);
            button.setBorder(new EmptyBorder(8, 14, 8, 14));
            return button;
        }

        private JButton secondaryButton(String text) {
            JButton button = new JButton(text);
            button.setBackground(new Color(238, 242, 247));
            button.setForeground(TEXT);
            button.setFocusPainted(false);
            button.setBorder(new EmptyBorder(8, 14, 8, 14));
            return button;
        }

        private GridBagConstraints constraints() {
            GridBagConstraints c = new GridBagConstraints();
            c.gridx = 0;
            c.gridy = 0;
            c.insets = new Insets(5, 6, 5, 6);
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

    static class EntryRenderer extends DefaultListCellRenderer {
        @Override
        public Component getListCellRendererComponent(JList<?> list, Object value, int index,
                                                      boolean isSelected, boolean cellHasFocus) {
            JLabel label = (JLabel) super.getListCellRendererComponent(list, value, index, isSelected, cellHasFocus);
            HistoricalEntry entry = (HistoricalEntry) value;
            label.setBorder(new EmptyBorder(10, 12, 10, 12));
            label.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 13));
            label.setText((entry.isEvent() ? "⚑ " : "▬ ") + entry);
            label.setForeground(isSelected ? Color.WHITE : TEXT);
            label.setBackground(isSelected ? new Color(31, 41, 55) : Color.WHITE);
            return label;
        }
    }

    static class TimelinePanel extends JPanel {
        private LocalDate from = LocalDate.of(1789, 1, 1);
        private LocalDate to = LocalDate.of(1800, 1, 1);
        private List<HistoricalEntry> entries = List.of();

        TimelinePanel() {
            setPreferredSize(new Dimension(620, 420));
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
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            int left = 64;
            int right = getWidth() - 36;
            int axisY = 126;
            long totalDays = Math.max(1, to.toEpochDay() - from.toEpochDay());

            drawHeader(g, left, right, axisY);
            drawTicks(g, left, right, axisY, totalDays);

            List<HistoricalEntry> events = new ArrayList<>();
            List<HistoricalEntry> processes = new ArrayList<>();
            for (HistoricalEntry entry : entries) {
                if (entry.isEvent()) {
                    events.add(entry);
                } else {
                    processes.add(entry);
                }
            }

            drawEvents(g, events, left, right, axisY, totalDays);
            drawProcesses(g, processes, left, right, axisY, totalDays);
            drawLegend(g, left, getHeight() - 54);
        }

        private void drawHeader(Graphics2D g, int left, int right, int axisY) {
            g.setColor(TEXT);
            g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 20));
            g.drawString("Zeitstrahl historischer Einträge", left, 34);

            g.setColor(MUTED);
            g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 12));
            g.drawString("TreeMap / Rot-Schwarz-Baum sortiert nach Startdatum", left, 54);

            g.setColor(new Color(17, 24, 39));
            g.setStroke(new BasicStroke(3f));
            g.drawLine(left, axisY, right, axisY);

            g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 12));
            g.drawString(from.toString(), left, axisY + 28);
            g.drawString(to.toString(), Math.max(left, right - 86), axisY + 28);
        }

        private void drawTicks(Graphics2D g, int left, int right, int axisY, long totalDays) {
            g.setStroke(new BasicStroke(1f));
            for (int i = 0; i <= 8; i++) {
                int x = left + (i * (right - left)) / 8;
                g.setColor(new Color(203, 213, 225));
                g.drawLine(x, axisY - 10, x, getHeight() - 78);
                g.setColor(new Color(75, 85, 99));
                g.drawLine(x, axisY - 18, x, axisY + 18);

                LocalDate tickDate = from.plusDays((totalDays * i) / 8);
                g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 11));
                g.drawString(String.valueOf(tickDate.getYear()), x - 14, axisY + 44);
            }
        }

        private void drawEvents(Graphics2D g, List<HistoricalEntry> events,
                                int left, int right, int axisY, long totalDays) {
            int[] lanes = {34, 58, 82};
            for (int i = 0; i < events.size(); i++) {
                HistoricalEntry entry = events.get(i);
                int x = position(entry.startDate, left, right, totalDays);
                int top = lanes[i % lanes.length];

                g.setColor(new Color(31, 41, 55));
                g.setStroke(new BasicStroke(1.6f));
                g.drawLine(x, top + 24, x, axisY);

                g.setColor(RED);
                Polygon flag = new Polygon(
                        new int[]{x, x, x + 12, x},
                        new int[]{top, top + 24, top + 12, top},
                        4
                );
                g.fillPolygon(flag);

                g.setColor(RED);
                g.fillRoundRect(x + 5, top - 4, Math.min(190, textWidth(g, entry.title) + 12), 21, 4, 4);
                g.setColor(Color.WHITE);
                g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 11));
                g.drawString(shorten(entry.title, 26), x + 11, top + 11);

                g.setColor(TEXT);
                g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 11));
                g.drawString(entry.startDate.toString(), x + 8, top + 31);
            }
        }

        private void drawProcesses(Graphics2D g, List<HistoricalEntry> processes,
                                   int left, int right, int axisY, long totalDays) {
            int rowHeight = 42;
            int startY = axisY + 76;
            for (int i = 0; i < processes.size(); i++) {
                HistoricalEntry entry = processes.get(i);
                int y = startY + i * rowHeight;
                int x1 = position(entry.startDate, left, right, totalDays);
                int x2 = position(entry.endDate, left, right, totalDays);
                int width = Math.max(32, x2 - x1);

                g.setColor(GREEN);
                g.fillRoundRect(x1, y, width, 26, 8, 8);
                g.setColor(new Color(101, 163, 13));
                g.drawRoundRect(x1, y, width, 26, 8, 8);
                g.setColor(Color.WHITE);
                g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 12));
                g.drawString(shorten(entry.title, Math.max(10, width / 7)), x1 + 10, y + 18);

                g.setColor(GREEN_DARK);
                g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 10));
                g.drawString(entry.startDate + " -> " + entry.endDate, x1, y + 39);
            }
        }

        private void drawLegend(Graphics2D g, int x, int y) {
            g.setColor(new Color(248, 250, 252));
            g.fillRoundRect(x, y, 250, 38, 10, 10);
            g.setColor(BORDER);
            g.drawRoundRect(x, y, 250, 38, 10, 10);

            g.setColor(RED);
            Polygon flag = new Polygon(
                    new int[]{x + 14, x + 14, x + 26, x + 14},
                    new int[]{y + 10, y + 27, y + 18, y + 10},
                    4
            );
            g.fillPolygon(flag);
            g.setColor(TEXT);
            g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 12));
            g.drawString("Ereignis", x + 34, y + 24);

            g.setColor(GREEN);
            g.fillRoundRect(x + 120, y + 12, 34, 14, 6, 6);
            g.setColor(TEXT);
            g.drawString("Prozess", x + 164, y + 24);
        }

        private int position(LocalDate date, int left, int right, long totalDays) {
            long offset = Math.max(0, Math.min(totalDays, date.toEpochDay() - from.toEpochDay()));
            return left + (int) ((offset * (right - left)) / totalDays);
        }

        private int textWidth(Graphics2D g, String text) {
            return g.getFontMetrics(new Font(Font.SANS_SERIF, Font.BOLD, 11)).stringWidth(shorten(text, 26));
        }

        private String shorten(String text, int maxLength) {
            if (text.length() <= maxLength) {
                return text;
            }
            return text.substring(0, Math.max(1, maxLength - 1)) + "…";
        }
    }
}
