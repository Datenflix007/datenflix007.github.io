import javax.swing.BorderFactory;
import javax.swing.DefaultListCellRenderer;
import javax.swing.DefaultListModel;
import javax.swing.JButton;
import javax.swing.JEditorPane;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JList;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSplitPane;
import javax.swing.JTextField;
import javax.swing.ListSelectionModel;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.border.EmptyBorder;
import javax.swing.event.HyperlinkEvent;
import java.awt.BasicStroke;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Cursor;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.Polygon;
import java.awt.Rectangle;
import java.awt.RenderingHints;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.event.MouseWheelEvent;
import java.io.File;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
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
     * Rot-Schwarz-Baum-Modell:
     * - Schlüssel: startDate
     * - Knotenwert: Liste historischer Einträge mit gleichem Startdatum
     * - Ordnung: TreeMap hält die Schlüssel sortiert und ist intern ein Rot-Schwarz-Baum
     * - Bereichssuche: subMap/headMap entspricht Suche auf sortierten Baumintervallen
     */
    private final TreeMap<LocalDate, List<HistoricalEntry>> redBlackTreeByStartDate = new TreeMap<>();

    public void rbInsert(HistoricalEntry entry) {
        redBlackTreeByStartDate
                .computeIfAbsent(entry.startDate, ignored -> new ArrayList<>())
                .add(entry);
    }

    public List<HistoricalEntry> rbRangeSearchByStartDate(LocalDate from, LocalDate to) {
        List<HistoricalEntry> result = new ArrayList<>();
        for (List<HistoricalEntry> nodeValues : redBlackTreeByStartDate.subMap(from, true, to, true).values()) {
            result.addAll(nodeValues);
        }
        return result;
    }

    public List<HistoricalEntry> rbIntervalSearch(LocalDate from, LocalDate to) {
        List<HistoricalEntry> result = new ArrayList<>();
        for (List<HistoricalEntry> nodeValues : redBlackTreeByStartDate.headMap(to, true).values()) {
            for (HistoricalEntry entry : nodeValues) {
                if (!entry.endDate.isBefore(from)) {
                    result.add(entry);
                }
            }
        }
        return result;
    }

    public HistoricalEntry rbSuccessor(LocalDate date) {
        Map.Entry<LocalDate, List<HistoricalEntry>> successor = redBlackTreeByStartDate.ceilingEntry(date);
        return successor == null || successor.getValue().isEmpty() ? null : successor.getValue().get(0);
    }

    public HistoricalEntry findByTitle(String title) {
        for (List<HistoricalEntry> nodeValues : redBlackTreeByStartDate.values()) {
            for (HistoricalEntry entry : nodeValues) {
                if (entry.title.equals(title)) {
                    return entry;
                }
            }
        }
        return null;
    }

    public List<HistoricalEntry> relatedEventsFor(HistoricalEntry process) {
        List<HistoricalEntry> events = new ArrayList<>();
        if (process.isEvent()) {
            return events;
        }
        for (HistoricalEntry candidate : rbIntervalSearch(process.startDate, process.endDate)) {
            if (candidate.isEvent() && candidate != process) {
                events.add(candidate);
            }
        }
        return events;
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
        UIManager.put("List.background", Color.WHITE);
        UIManager.put("List.foreground", TEXT);
    }

    private static HistoricalRBTreeDemo seededDatabase() {
        HistoricalRBTreeDemo db = new HistoricalRBTreeDemo();

        db.rbInsert(new HistoricalEntry(
                LocalDate.of(1789, 7, 14),
                LocalDate.of(1789, 7, 14),
                "Sturm auf die Bastille",
                List.of("Camille Desmoulins", "Pariser Nationalgarde"),
                List.of("docs/bastille_bericht.pdf", "images/bastille.jpg")
        ));

        db.rbInsert(new HistoricalEntry(
                LocalDate.of(1789, 8, 26),
                LocalDate.of(1789, 8, 26),
                "Erklärung der Menschen- und Bürgerrechte",
                List.of("Nationalversammlung", "Marquis de Lafayette"),
                List.of("docs/declaration_1789.pdf")
        ));

        db.rbInsert(new HistoricalEntry(
                LocalDate.of(1792, 9, 21),
                LocalDate.of(1799, 11, 9),
                "Erste Französische Republik",
                List.of("Nationalkonvent", "Napoleon Bonaparte"),
                List.of("docs/republic_timeline.md", "archive/republic_sources.zip")
        ));

        db.rbInsert(new HistoricalEntry(
                LocalDate.of(1793, 9, 5),
                LocalDate.of(1794, 7, 27),
                "Schreckensherrschaft",
                List.of("Maximilien Robespierre", "Wohlfahrtsausschuss"),
                List.of("docs/terror_period_sources.pdf")
        ));

        db.rbInsert(new HistoricalEntry(
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
            this.title = title.isBlank() ? "Unbenannter Eintrag" : title;
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
    }

    static class HistoricalDatabaseFrame extends JFrame {
        private final HistoricalRBTreeDemo database;
        private final DefaultListModel<HistoricalEntry> listModel = new DefaultListModel<>();
        private final JList<HistoricalEntry> entryList = new JList<>(listModel);
        private final TimelinePanel timelinePanel = new TimelinePanel();
        private final JEditorPane detailsPane = new JEditorPane("text/html", "");

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
            setSize(1180, 760);
            setMinimumSize(new Dimension(1020, 680));
            setLocationRelativeTo(null);
            setLayout(new BorderLayout(14, 14));
            getContentPane().setBackground(BG);

            add(buildHeader(), BorderLayout.NORTH);
            add(buildMainPanel(), BorderLayout.CENTER);

            entryList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
            entryList.setCellRenderer(new EntryRenderer());
            entryList.addListSelectionListener(event -> {
                if (!event.getValueIsAdjusting()) {
                    showDetails(entryList.getSelectedValue());
                }
            });

            timelinePanel.setEntrySelectionListener(this::selectEntry);
            timelinePanel.setRangeChangeListener((from, to) -> {
                fromField.setText(from.toString());
                toField.setText(to.toString());
                refreshResults(false);
            });

            detailsPane.setEditable(false);
            detailsPane.setOpaque(false);
            detailsPane.addHyperlinkListener(event -> {
                if (event.getEventType() == HyperlinkEvent.EventType.ACTIVATED) {
                    String description = event.getDescription();
                    if (description != null && description.startsWith("event:")) {
                        selectEntry(database.findByTitle(description.substring("event:".length())));
                    }
                }
            });

            refreshResults(true);
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
            searchButton.addActionListener(event -> refreshResults(true));
            query.add(searchButton, c);
            c.gridx++;

            JButton nextButton = secondaryButton("Nächster Eintrag");
            nextButton.addActionListener(event -> showNextEntry());
            query.add(nextButton, c);
            c.gridx++;

            JButton newButton = primaryButton("Neuer Eintrag");
            newButton.addActionListener(event -> showNewEntryOverlay());
            query.add(newButton, c);
            panel.add(query, BorderLayout.EAST);

            return panel;
        }

        private JPanel buildMainPanel() {
            JPanel panel = new JPanel(new BorderLayout(14, 14));
            panel.setOpaque(false);
            panel.setBorder(new EmptyBorder(0, 16, 0, 16));

            JScrollPane listScroll = new JScrollPane(entryList);
            listScroll.setPreferredSize(new Dimension(390, 280));
            listScroll.setBorder(BorderFactory.createTitledBorder(BorderFactory.createLineBorder(BORDER), "Einträge"));

            JPanel center = new JPanel(new BorderLayout(12, 12));
            center.setOpaque(false);
            JPanel timelineCard = cardPanel(new BorderLayout());
            timelineCard.setBorder(new EmptyBorder(12, 12, 12, 12));
            timelineCard.add(timelinePanel, BorderLayout.CENTER);

            JScrollPane detailsScroll = new JScrollPane(detailsPane);
            detailsScroll.setPreferredSize(new Dimension(300, 150));
            detailsScroll.setBorder(BorderFactory.createTitledBorder(BorderFactory.createLineBorder(BORDER), "Description"));

            JSplitPane verticalSplit = new JSplitPane(JSplitPane.VERTICAL_SPLIT, timelineCard, detailsScroll);
            verticalSplit.setResizeWeight(0.72);
            verticalSplit.setContinuousLayout(true);
            verticalSplit.setBorder(null);
            verticalSplit.setDividerSize(8);
            center.add(verticalSplit, BorderLayout.CENTER);

            JSplitPane horizontalSplit = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, listScroll, center);
            horizontalSplit.setResizeWeight(0.32);
            horizontalSplit.setContinuousLayout(true);
            horizontalSplit.setBorder(null);
            horizontalSplit.setDividerSize(8);
            panel.add(horizontalSplit, BorderLayout.CENTER);

            SwingUtilities.invokeLater(() -> {
                horizontalSplit.setDividerLocation(390);
                verticalSplit.setDividerLocation(0.72);
            });
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
            panel.add(smallLabel("Dateien"), c);
            c.gridx++;
            panel.add(styledField(docsField), c);
            c.gridx++;

            JButton chooseFilesButton = secondaryButton("Dateien wählen");
            chooseFilesButton.addActionListener(event -> chooseFiles());
            panel.add(chooseFilesButton, c);
            c.gridx++;

            return panel;
        }

        private void showNewEntryOverlay() {
            JPanel form = buildInputPanel();
            int result = JOptionPane.showConfirmDialog(
                    this,
                    form,
                    "Neuer Eintrag",
                    JOptionPane.OK_CANCEL_OPTION,
                    JOptionPane.PLAIN_MESSAGE
            );
            if (result == JOptionPane.OK_OPTION) {
                addEntryFromForm();
            }
        }

        private void chooseFiles() {
            JFileChooser chooser = new JFileChooser();
            chooser.setMultiSelectionEnabled(true);
            int result = chooser.showOpenDialog(this);
            if (result == JFileChooser.APPROVE_OPTION) {
                List<String> paths = new ArrayList<>();
                for (File file : chooser.getSelectedFiles()) {
                    paths.add(file.getAbsolutePath());
                }
                docsField.setText(String.join(", ", paths));
            }
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
                database.rbInsert(entry);
                refreshResults(true);
                selectEntry(entry);
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

        private void refreshResults(boolean selectFirst) {
            try {
                LocalDate from = LocalDate.parse(fromField.getText().trim());
                LocalDate to = LocalDate.parse(toField.getText().trim());
                List<HistoricalEntry> entries = database.rbIntervalSearch(from, to);

                HistoricalEntry selected = entryList.getSelectedValue();
                listModel.clear();
                for (HistoricalEntry entry : entries) {
                    listModel.addElement(entry);
                }
                timelinePanel.setRange(from, to, entries);

                if (selected != null && entries.contains(selected)) {
                    selectEntry(selected);
                } else if (selectFirst && !entries.isEmpty()) {
                    selectEntry(entries.get(0));
                } else if (entries.isEmpty()) {
                    showDetails(null);
                }
            } catch (DateTimeParseException ex) {
                JOptionPane.showMessageDialog(this, "Bitte Suchzeitraum im Format YYYY-MM-DD eingeben.");
            }
        }

        private void showNextEntry() {
            try {
                LocalDate from = LocalDate.parse(fromField.getText().trim());
                HistoricalEntry next = database.rbSuccessor(from);
                if (next == null) {
                    showDetails(null);
                } else {
                    selectEntry(next);
                }
            } catch (DateTimeParseException ex) {
                JOptionPane.showMessageDialog(this, "Bitte Startdatum im Format YYYY-MM-DD eingeben.");
            }
        }

        private void selectEntry(HistoricalEntry entry) {
            if (entry == null) {
                showDetails(null);
                return;
            }
            entryList.setSelectedValue(entry, true);
            showDetails(entry);
            timelinePanel.setSelectedEntry(entry);
        }

        private void showDetails(HistoricalEntry entry) {
            if (entry == null) {
                detailsPane.setText("<html><body style='font-family:sans-serif;color:#6b7280'>Kein Eintrag ausgewählt.</body></html>");
                return;
            }

            StringBuilder html = new StringBuilder();
            html.append("<html><body style='font-family:sans-serif;color:#1f2937'>");
            html.append("<h2 style='margin:0 0 6px 0'>").append(escape(entry.title)).append("</h2>");
            html.append("<p><b>Typ:</b> ").append(entry.isEvent() ? "Ereignis" : "Prozess").append("<br>");
            html.append("<b>Zeitraum:</b> ").append(entry.startDate).append(" bis ").append(entry.endDate).append("<br>");
            html.append("<b>Personen:</b> ").append(escape(String.join(", ", entry.people))).append("<br>");
            html.append("<b>Dateien:</b> ").append(escape(String.join(", ", entry.documents))).append("</p>");

            List<HistoricalEntry> related = database.relatedEventsFor(entry);
            if (!related.isEmpty()) {
                html.append("<p><b>Verwandte Ereignisse im Prozess:</b> ");
                for (int i = 0; i < related.size(); i++) {
                    HistoricalEntry relatedEvent = related.get(i);
                    if (i > 0) {
                        html.append(", ");
                    }
                    html.append("<a href='event:").append(escape(relatedEvent.title)).append("'>")
                            .append(escape(relatedEvent.title))
                            .append("</a>");
                }
                html.append("</p>");
            }
            html.append("</body></html>");
            detailsPane.setText(html.toString());
            detailsPane.setCaretPosition(0);
        }

        private String escape(String value) {
            return value
                    .replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;");
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

    interface EntrySelectionListener {
        void entrySelected(HistoricalEntry entry);
    }

    interface RangeChangeListener {
        void rangeChanged(LocalDate from, LocalDate to);
    }

    static class TimelinePanel extends JPanel {
        private LocalDate from = LocalDate.of(1789, 1, 1);
        private LocalDate to = LocalDate.of(1800, 1, 1);
        private List<HistoricalEntry> entries = List.of();
        private final List<EntryHitBox> hitBoxes = new ArrayList<>();
        private HistoricalEntry selectedEntry;
        private EntrySelectionListener entrySelectionListener;
        private RangeChangeListener rangeChangeListener;
        private int dragStartX;
        private LocalDate dragStartFrom;
        private LocalDate dragStartTo;

        TimelinePanel() {
            setPreferredSize(new Dimension(650, 450));
            setBackground(Color.WHITE);
            setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));

            MouseAdapter mouse = new MouseAdapter() {
                @Override
                public void mousePressed(MouseEvent event) {
                    if (SwingUtilities.isLeftMouseButton(event)) {
                        dragStartX = event.getX();
                        dragStartFrom = from;
                        dragStartTo = to;
                    }
                }

                @Override
                public void mouseDragged(MouseEvent event) {
                    if (dragStartFrom == null || !SwingUtilities.isLeftMouseButton(event)) {
                        return;
                    }
                    int dx = event.getX() - dragStartX;
                    long visibleDays = Math.max(1, ChronoUnit.DAYS.between(dragStartFrom, dragStartTo));
                    int usableWidth = Math.max(1, getWidth() - 120);
                    long deltaDays = Math.round((-dx * visibleDays) / (double) usableWidth);
                    from = dragStartFrom.plusDays(deltaDays);
                    to = dragStartTo.plusDays(deltaDays);
                    if (rangeChangeListener != null) {
                        rangeChangeListener.rangeChanged(from, to);
                    }
                    repaint();
                }

                @Override
                public void mouseWheelMoved(MouseWheelEvent event) {
                    zoomAt(event.getX(), event.getWheelRotation());
                }

                @Override
                public void mouseClicked(MouseEvent event) {
                    for (EntryHitBox hitBox : hitBoxes) {
                        if (hitBox.bounds.contains(event.getPoint())) {
                            selectedEntry = hitBox.entry;
                            if (entrySelectionListener != null) {
                                entrySelectionListener.entrySelected(hitBox.entry);
                            }
                            repaint();
                            return;
                        }
                    }
                }
            };
            addMouseListener(mouse);
            addMouseMotionListener(mouse);
            addMouseWheelListener(mouse);
        }

        void setRange(LocalDate from, LocalDate to, List<HistoricalEntry> entries) {
            this.from = from;
            this.to = to.isAfter(from) ? to : from.plusDays(1);
            this.entries = List.copyOf(entries);
            repaint();
        }

        void setEntrySelectionListener(EntrySelectionListener listener) {
            this.entrySelectionListener = listener;
        }

        void setRangeChangeListener(RangeChangeListener listener) {
            this.rangeChangeListener = listener;
        }

        void setSelectedEntry(HistoricalEntry selectedEntry) {
            this.selectedEntry = selectedEntry;
            repaint();
        }

        @Override
        protected void paintComponent(Graphics graphics) {
            super.paintComponent(graphics);
            hitBoxes.clear();
            Graphics2D g = (Graphics2D) graphics;
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            int left = 64;
            int right = getWidth() - 36;
            int axisY = getHeight() / 2;
            long totalDays = Math.max(1, ChronoUnit.DAYS.between(from, to));

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
            drawLegend(g, left, getHeight() - 44);
        }

        private void drawHeader(Graphics2D g, int left, int right, int axisY) {
            g.setColor(TEXT);
            g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 20));
            g.drawString("Zeitstrahl historischer Einträge", left, 34);

            g.setColor(MUTED);
            g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 12));
            g.drawString("Linke Maustaste ziehen verschiebt den Zeitraum", left, 54);

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
                g.drawLine(x, 74, x, getHeight() - 64);
                g.setColor(new Color(75, 85, 99));
                g.drawLine(x, axisY - 18, x, axisY + 18);

                LocalDate tickDate = from.plusDays((totalDays * i) / 8);
                g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 11));
                g.drawString(String.valueOf(tickDate.getYear()), x - 14, axisY + 44);
            }
        }

        private void drawEvents(Graphics2D g, List<HistoricalEntry> events,
                                int left, int right, int axisY, long totalDays) {
            int[] offsets = {130, 98, 66};
            for (int i = 0; i < events.size(); i++) {
                HistoricalEntry entry = events.get(i);
                int x = position(entry.startDate, left, right, totalDays);
                int top = axisY - offsets[i % offsets.length];

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

                int labelWidth = Math.min(210, textWidth(g, entry.title) + 14);
                Rectangle hit = new Rectangle(x - 4, top - 6, labelWidth + 22, 44);
                hitBoxes.add(new EntryHitBox(hit, entry));

                if (entry == selectedEntry) {
                    g.setColor(new Color(254, 226, 226));
                    g.fillRoundRect(hit.x, hit.y, hit.width, hit.height, 8, 8);
                }

                g.setColor(RED);
                g.fillRoundRect(x + 5, top - 4, labelWidth, 21, 4, 4);
                g.setColor(Color.WHITE);
                g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 11));
                g.drawString(shorten(entry.title, 28), x + 11, top + 11);

                g.setColor(TEXT);
                g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 11));
                g.drawString(entry.startDate.toString(), x + 8, top + 31);
            }
        }

        private void drawProcesses(Graphics2D g, List<HistoricalEntry> processes,
                                   int left, int right, int axisY, long totalDays) {
            int rowHeight = 44;
            int startY = axisY + 62;
            for (int i = 0; i < processes.size(); i++) {
                HistoricalEntry entry = processes.get(i);
                int y = startY + i * rowHeight;
                int x1 = position(entry.startDate, left, right, totalDays);
                int x2 = position(entry.endDate, left, right, totalDays);
                int width = Math.max(38, x2 - x1);

                Rectangle hit = new Rectangle(x1, y - 2, width, 32);
                hitBoxes.add(new EntryHitBox(hit, entry));

                if (entry == selectedEntry) {
                    g.setColor(new Color(236, 252, 203));
                    g.fillRoundRect(x1 - 6, y - 7, width + 12, 40, 10, 10);
                }

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
            g.fillRoundRect(x, y, 284, 34, 10, 10);
            g.setColor(BORDER);
            g.drawRoundRect(x, y, 284, 34, 10, 10);

            g.setColor(RED);
            Polygon flag = new Polygon(
                    new int[]{x + 14, x + 14, x + 26, x + 14},
                    new int[]{y + 8, y + 25, y + 16, y + 8},
                    4
            );
            g.fillPolygon(flag);
            g.setColor(TEXT);
            g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 12));
            g.drawString("Ereignis anklickbar", x + 34, y + 22);

            g.setColor(GREEN);
            g.fillRoundRect(x + 162, y + 10, 34, 14, 6, 6);
            g.setColor(TEXT);
            g.drawString("Prozess", x + 206, y + 22);
        }

        private int position(LocalDate date, int left, int right, long totalDays) {
            long offset = Math.max(0, Math.min(totalDays, ChronoUnit.DAYS.between(from, date)));
            return left + (int) ((offset * (right - left)) / totalDays);
        }

        private void zoomAt(int mouseX, int wheelRotation) {
            int left = 64;
            int right = Math.max(left + 1, getWidth() - 36);
            long visibleDays = Math.max(2, ChronoUnit.DAYS.between(from, to));
            double zoomFactor = wheelRotation < 0 ? 0.78 : 1.28;
            long newVisibleDays = Math.round(visibleDays * zoomFactor);
            newVisibleDays = Math.max(7, Math.min(36500, newVisibleDays));

            double anchorRatio = (mouseX - left) / (double) Math.max(1, right - left);
            anchorRatio = Math.max(0.0, Math.min(1.0, anchorRatio));
            LocalDate anchorDate = from.plusDays(Math.round(visibleDays * anchorRatio));

            long daysBeforeAnchor = Math.round(newVisibleDays * anchorRatio);
            LocalDate newFrom = anchorDate.minusDays(daysBeforeAnchor);
            LocalDate newTo = newFrom.plusDays(newVisibleDays);

            from = newFrom;
            to = newTo;
            if (rangeChangeListener != null) {
                rangeChangeListener.rangeChanged(from, to);
            }
            repaint();
        }

        private int textWidth(Graphics2D g, String text) {
            return g.getFontMetrics(new Font(Font.SANS_SERIF, Font.BOLD, 11)).stringWidth(shorten(text, 28));
        }

        private String shorten(String text, int maxLength) {
            if (text.length() <= maxLength) {
                return text;
            }
            return text.substring(0, Math.max(1, maxLength - 1)) + "…";
        }
    }

    static class EntryHitBox {
        final Rectangle bounds;
        final HistoricalEntry entry;

        EntryHitBox(Rectangle bounds, HistoricalEntry entry) {
            this.bounds = bounds;
            this.entry = entry;
        }
    }
}
