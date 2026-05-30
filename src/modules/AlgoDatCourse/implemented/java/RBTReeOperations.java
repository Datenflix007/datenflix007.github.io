import javax.swing.*;
import javax.swing.filechooser.FileNameExtensionFilter;
import java.awt.*;
import java.awt.event.*;
import java.io.*;
import java.util.*;
import java.util.List;

public class RBTReeOperations {
    
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            JFrame frame = new JFrame("RB-Tree Visualizer");
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setSize(1600, 950);
            frame.setLocationRelativeTo(null);
            frame.setResizable(true);
            
            RBTree<Integer, String> tree = new RBTree<>();
            int[] values = {15, 10, 20, 8, 12, 17, 25, 5, 11, 14, 16, 22, 27};
            for (int val : values) {
                tree.insert(val, "Value_" + val);
            }
            
            RBTreePanel panel = new RBTreePanel(tree);
            frame.setJMenuBar(createMenuBar(panel));
            frame.add(panel);
            frame.setVisible(true);
        });
    }
    
    private static JMenuBar createMenuBar(RBTreePanel panel) {
        JMenuBar menuBar = new JMenuBar();
        
        JMenu fileMenu = new JMenu("FILE");
        fileMenu.add(createMenuItem("✚ Neuer Baum", () -> panel.handleNewTree()));
        fileMenu.add(createMenuItem("💾 Speichern", () -> panel.handleSave()));
        fileMenu.add(createMenuItem("📂 Laden", () -> panel.handleLoad()));
        fileMenu.addSeparator();
        fileMenu.add(createMenuItem("Exit", () -> System.exit(0)));
        
        JMenu dictMenu = new JMenu("DICTIONARY");
        dictMenu.add(createMenuItem("➕ Insert", () -> panel.handleInsert()));
        dictMenu.add(createMenuItem("❌ Delete", () -> panel.handleDelete()));
        dictMenu.add(createMenuItem("🔍 Search", () -> panel.handleSearch()));
        dictMenu.addSeparator();
        dictMenu.add(createMenuItem("⬇ Min", () -> panel.handleMin()));
        dictMenu.add(createMenuItem("⬆ Max", () -> panel.handleMax()));
        dictMenu.add(createMenuItem("➡ Successor", () -> panel.handleSuccessor()));
        dictMenu.add(createMenuItem("⬅ Predecessor", () -> panel.handlePredecessor()));
        dictMenu.addSeparator();
        dictMenu.add(createMenuItem("🟨 greaterThan", () -> panel.showCountDialog(true)));
        dictMenu.add(createMenuItem("🟨 lessThan", () -> panel.showCountDialog(false)));
        
        menuBar.add(fileMenu);
        menuBar.add(dictMenu);
        
        return menuBar;
    }
    
    private static JMenuItem createMenuItem(String text, Runnable action) {
        JMenuItem item = new JMenuItem(text);
        item.addActionListener(e -> action.run());
        return item;
    }
}

class RBTreePanel extends JPanel {
    private RBTree<Integer, String> tree;
    private TreeCanvasPanel canvasPanel;
    private JTextField inputField;
    private JLabel resultLabel;
    
    public RBTreePanel(RBTree<Integer, String> tree) {
        this.tree = tree;
        setLayout(new BorderLayout());
        setBackground(new Color(245, 247, 250));
        
        canvasPanel = new TreeCanvasPanel(tree);
        add(canvasPanel, BorderLayout.CENTER);
        
        JPanel statusPanel = new JPanel();
        statusPanel.setBackground(new Color(235, 240, 245));
        statusPanel.setBorder(BorderFactory.createLineBorder(new Color(200, 210, 220)));
        
        resultLabel = new JLabel("Bereit");
        resultLabel.setFont(new Font("Segoe UI", Font.BOLD, 12));
        resultLabel.setForeground(new Color(40, 120, 200));
        resultLabel.setBorder(BorderFactory.createEmptyBorder(5, 10, 5, 10));
        statusPanel.add(resultLabel);
        
        add(statusPanel, BorderLayout.SOUTH);
    }
    
    public void handleInsert() {
        String keyStr = JOptionPane.showInputDialog(this, "Key eingeben:", "");
        if (keyStr == null) return;

        try {
            int key = Integer.parseInt(keyStr);

            JPanel panel = new JPanel(new BorderLayout(5, 5));
            JLabel label = new JLabel("Value (Text, URL oder Dateipfad):");
            JTextField valueField = new JTextField("Value_" + key, 22);
            JButton browseBtn = new JButton("📁");
            browseBtn.setToolTipText("Datei auswählen");
            browseBtn.addActionListener(e -> {
                JFileChooser fc = new JFileChooser();
                fc.setDialogTitle("Datei auswählen");
                if (fc.showOpenDialog(RBTreePanel.this) == JFileChooser.APPROVE_OPTION) {
                    valueField.setText(fc.getSelectedFile().getAbsolutePath());
                }
            });
            JPanel inputRow = new JPanel(new BorderLayout(4, 0));
            inputRow.add(valueField, BorderLayout.CENTER);
            inputRow.add(browseBtn, BorderLayout.EAST);
            panel.add(label, BorderLayout.NORTH);
            panel.add(inputRow, BorderLayout.CENTER);

            int result = JOptionPane.showConfirmDialog(this, panel,
                "Insert – Key " + key, JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
            if (result != JOptionPane.OK_OPTION) return;

            String value = valueField.getText().trim();
            if (value.isEmpty()) value = "Value_" + key;

            tree.insert(key, value);
            canvasPanel.clearHighlight();
            canvasPanel.repaint();
            String display = value.length() > 40 ? value.substring(0, 40) + "…" : value;
            resultLabel.setText("✓ " + key + " → " + display);
        } catch (NumberFormatException ex) {
            resultLabel.setText("✗ Ungültige Key-Eingabe");
        }
    }
    
    public void handleDelete() {
        String keyStr = JOptionPane.showInputDialog(this, "Key eingeben:", "");
        if (keyStr == null) return;
        
        try {
            int key = Integer.parseInt(keyStr);
            boolean deleted = tree.delete(key);
            canvasPanel.clearHighlight();
            canvasPanel.repaint();
            resultLabel.setText(deleted ? "✓ " + key + " gelöscht" : "✗ " + key + " nicht gefunden");
        } catch (NumberFormatException ex) {
            resultLabel.setText("✗ Ungültige Eingabe");
        }
    }
    
    public void handleSearch() {
        String keyStr = JOptionPane.showInputDialog(this, "Key eingeben:", "");
        if (keyStr == null) return;
        
        try {
            int key = Integer.parseInt(keyStr);
            String result = tree.search(key);
            canvasPanel.clearHighlight();
            canvasPanel.highlightNodes(Arrays.asList(key));
            canvasPanel.repaint();
            resultLabel.setText(result != null ? "✓ Gefunden: " + result : "✗ Nicht gefunden");
        } catch (NumberFormatException ex) {
            resultLabel.setText("✗ Ungültige Eingabe");
        }
    }
    
    public void handleMin() {
        Integer min = tree.minimum();
        canvasPanel.clearHighlight();
        if (min != null) {
            canvasPanel.highlightNodes(Arrays.asList(min));
            canvasPanel.repaint();
            resultLabel.setText("Minimum: " + min);
        } else {
            resultLabel.setText("Baum ist leer");
        }
    }
    
    public void handleMax() {
        Integer max = tree.maximum();
        canvasPanel.clearHighlight();
        if (max != null) {
            canvasPanel.highlightNodes(Arrays.asList(max));
            canvasPanel.repaint();
            resultLabel.setText("Maximum: " + max);
        } else {
            resultLabel.setText("Baum ist leer");
        }
    }
    
    public void handleSuccessor() {
        String keyStr = JOptionPane.showInputDialog(this, "Key eingeben:", "");
        if (keyStr == null) return;
        
        try {
            int key = Integer.parseInt(keyStr);
            Integer succ = tree.successor(key);
            canvasPanel.clearHighlight();
            if (succ != null) {
                canvasPanel.highlightNodes(Arrays.asList(succ));
                canvasPanel.repaint();
                resultLabel.setText("Successor von " + key + ": " + succ);
            } else {
                resultLabel.setText("Kein Successor");
            }
        } catch (NumberFormatException ex) {
            resultLabel.setText("✗ Ungültige Eingabe");
        }
    }
    
    public void handlePredecessor() {
        String keyStr = JOptionPane.showInputDialog(this, "Key eingeben:", "");
        if (keyStr == null) return;
        
        try {
            int key = Integer.parseInt(keyStr);
            Integer pred = tree.predecessor(key);
            canvasPanel.clearHighlight();
            if (pred != null) {
                canvasPanel.highlightNodes(Arrays.asList(pred));
                canvasPanel.repaint();
                resultLabel.setText("Predecessor von " + key + ": " + pred);
            } else {
                resultLabel.setText("Kein Predecessor");
            }
        } catch (NumberFormatException ex) {
            resultLabel.setText("✗ Ungültige Eingabe");
        }
    }
    
    public void showCountDialog(boolean isGreater) {
        String xStr = JOptionPane.showInputDialog(this, "Wert eingeben:", "");
        if (xStr == null) return;
        
        try {
            int x = Integer.parseInt(xStr);
            if (isGreater) {
                int count = tree.greaterThan(x);
                List<Integer> nodes = tree.getGreaterThan(x);
                canvasPanel.clearHighlight();
                canvasPanel.highlightNodes(nodes);
                canvasPanel.repaint();
                resultLabel.setText("greaterThan(" + x + ") = " + count + " 🟨");
            } else {
                int count = tree.lessThan(x);
                List<Integer> nodes = tree.getLessThan(x);
                canvasPanel.clearHighlight();
                canvasPanel.highlightNodes(nodes);
                canvasPanel.repaint();
                resultLabel.setText("lessThan(" + x + ") = " + count + " 🟨");
            }
        } catch (NumberFormatException ex) {
            resultLabel.setText("✗ Ungültige Eingabe");
        }
    }
    
    public void handleNewTree() {
        tree = new RBTree<>();
        canvasPanel.setTree(tree);
        canvasPanel.clearHighlight();
        canvasPanel.repaint();
        resultLabel.setText("✓ Neuer leerer Baum erstellt");
    }
    
    public void handleSave() {
        JFileChooser fileChooser = new JFileChooser();
        fileChooser.setFileFilter(new FileNameExtensionFilter("JSON Files", "json"));
        int result = fileChooser.showSaveDialog(this);
        if (result == JFileChooser.APPROVE_OPTION) {
            try {
                File file = fileChooser.getSelectedFile();
                String jsonContent = tree.toJSON();
                FileWriter writer = new FileWriter(file);
                writer.write(jsonContent);
                writer.close();
                resultLabel.setText("✓ Gespeichert: " + file.getName());
            } catch (IOException ex) {
                resultLabel.setText("✗ Fehler beim Speichern");
            }
        }
    }
    
    public void handleLoad() {
        JFileChooser fileChooser = new JFileChooser();
        fileChooser.setFileFilter(new FileNameExtensionFilter("JSON Files", "json"));
        int result = fileChooser.showOpenDialog(this);
        if (result == JFileChooser.APPROVE_OPTION) {
            try {
                File file = fileChooser.getSelectedFile();
                StringBuilder content = new StringBuilder();
                Scanner scanner = new Scanner(file);
                while (scanner.hasNextLine()) {
                    content.append(scanner.nextLine());
                }
                scanner.close();
                
                tree = RBTree.fromJSON(content.toString());
                canvasPanel.setTree(tree);
                canvasPanel.clearHighlight();
                canvasPanel.repaint();
                resultLabel.setText("✓ Geladen: " + file.getName());
            } catch (Exception ex) {
                resultLabel.setText("✗ Fehler beim Laden");
            }
        }
    }
}

class TreeCanvasPanel extends JPanel {
    private RBTree<Integer, String> tree;
    private Set<Integer> highlightedNodes;
    private Map<Integer, Double> wobbleOffsets;
    private static final int NODE_RADIUS = 30;
    private static final int LEVEL_HEIGHT = 100;
    private javax.swing.Timer animationTimer;
    private long animationStartTime;
    
    public TreeCanvasPanel(RBTree<Integer, String> tree) {
        this.tree = tree;
        this.highlightedNodes = new HashSet<>();
        this.wobbleOffsets = new HashMap<>();
        setBackground(new Color(245, 247, 250));
        setToolTipText("");

        startAnimation();
    }
    
    private void startAnimation() {
        animationStartTime = System.currentTimeMillis();
        animationTimer = new javax.swing.Timer(30, e -> {
            repaint();
        });
        animationTimer.start();
    }
    
    public void setTree(RBTree<Integer, String> newTree) {
        this.tree = newTree;
    }
    
    public void highlightNodes(List<Integer> nodes) {
        highlightedNodes.addAll(nodes);
    }
    
    public void clearHighlight() {
        highlightedNodes.clear();
    }
    
    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2d = (Graphics2D) g;
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        
        List<Integer> keys = tree.inorderKeys();
        if (keys.isEmpty()) {
            g2d.setFont(new Font("Segoe UI", Font.PLAIN, 20));
            g2d.setColor(new Color(150, 150, 150));
            String msg = "Baum ist leer • Gehe zu DICTIONARY > Insert";
            FontMetrics fm = g2d.getFontMetrics();
            int x = (getWidth() - fm.stringWidth(msg)) / 2;
            g2d.drawString(msg, x, getHeight() / 2);
            return;
        }
        
        Map<Integer, NodePosition> positions = calculateTreePositions();
        drawEdges(g2d, positions);
        drawNodes(g2d, positions);
    }
    
    private Map<Integer, NodePosition> calculateTreePositions() {
        Map<Integer, NodePosition> positions = new HashMap<>();
        if (tree.inorderKeys().isEmpty()) return positions;
        
        int width = getWidth();
        int startX = width / 2;
        int startY = 40;
        
        Integer root = tree.getRoot();
        if (root != null) {
            calculatePosition(positions, root, startX, startY, width / 4);
        }
        return positions;
    }
    
    private void calculatePosition(Map<Integer, NodePosition> positions, Integer key, int x, int y, int offset) {
        if (key == null) return;
        
        boolean isRed = tree.isNodeRed(key);
        positions.put(key, new NodePosition(key, x, y, isRed, tree.search(key)));
        
        Integer left = tree.getLeftChild(key);
        Integer right = tree.getRightChild(key);
        
        if (left != null) {
            calculatePosition(positions, left, x - offset, y + LEVEL_HEIGHT, Math.max(offset / 2, 30));
        }
        if (right != null) {
            calculatePosition(positions, right, x + offset, y + LEVEL_HEIGHT, Math.max(offset / 2, 30));
        }
    }
    
    private double getWobbleX(int nodeKey) {
        double t = (System.currentTimeMillis() - animationStartTime) / 1000.0;
        double phase = (nodeKey * 137.508) % (2 * Math.PI);
        return Math.sin(t * 0.6 + phase) * 3.5;
    }

    private double getWobbleY(int nodeKey) {
        double t = (System.currentTimeMillis() - animationStartTime) / 1000.0;
        double phase = (nodeKey * 137.508) % (2 * Math.PI);
        return Math.sin(t * 0.8 + phase + 1.0) * 3.5;
    }
    
    private void drawEdges(Graphics2D g2d, Map<Integer, NodePosition> positions) {
        g2d.setColor(new Color(180, 190, 200));
        g2d.setStroke(new BasicStroke(2.5f));
        
        List<Integer> keys = tree.inorderKeys();
        for (Integer key : keys) {
            NodePosition parent = positions.get(key);
            if (parent == null) continue;
            
            Integer left = tree.getLeftChild(key);
            Integer right = tree.getRightChild(key);
            
            int px = (int)(parent.x + getWobbleX(key));
            int py = (int)(parent.y + getWobbleY(key));

            if (left != null && positions.containsKey(left)) {
                NodePosition child = positions.get(left);
                int cx = (int)(child.x + getWobbleX(left));
                int cy = (int)(child.y + getWobbleY(left));
                g2d.drawLine(px, py + NODE_RADIUS, cx, cy - NODE_RADIUS);
            }
            if (right != null && positions.containsKey(right)) {
                NodePosition child = positions.get(right);
                int cx = (int)(child.x + getWobbleX(right));
                int cy = (int)(child.y + getWobbleY(right));
                g2d.drawLine(px, py + NODE_RADIUS, cx, cy - NODE_RADIUS);
            }
        }
    }
    
    private void drawNodes(Graphics2D g2d, Map<Integer, NodePosition> positions) {
        for (NodePosition np : positions.values()) {
            int x = (int)(np.x + getWobbleX(np.value));
            int y = (int)(np.y + getWobbleY(np.value));
            
            if (highlightedNodes.contains(np.value)) {
                g2d.setColor(new Color(255, 255, 0, 80));
                g2d.fillOval(x - NODE_RADIUS - 12, y - NODE_RADIUS - 12, 
                            (NODE_RADIUS + 12) * 2, (NODE_RADIUS + 12) * 2);
            }
            
            g2d.setColor(new Color(0, 0, 0, 30));
            g2d.fillOval(x - NODE_RADIUS + 3, y - NODE_RADIUS + 3, NODE_RADIUS * 2, NODE_RADIUS * 2);
            
            Color color = np.isRed ? new Color(220, 60, 60) : new Color(50, 50, 50);
            g2d.setColor(color);
            g2d.fillOval(x - NODE_RADIUS, y - NODE_RADIUS, NODE_RADIUS * 2, NODE_RADIUS * 2);
            
            g2d.setColor(np.isRed ? new Color(180, 20, 20) : new Color(20, 20, 20));
            g2d.setStroke(new BasicStroke(2.5f));
            g2d.drawOval(x - NODE_RADIUS, y - NODE_RADIUS, NODE_RADIUS * 2, NODE_RADIUS * 2);
            
            g2d.setColor(Color.WHITE);
            g2d.setFont(new Font("Segoe UI", Font.BOLD, 14));
            String text = String.valueOf(np.value);
            FontMetrics fm = g2d.getFontMetrics();
            int textX = x - fm.stringWidth(text) / 2;
            int textY = y + fm.getAscent() / 2 - 2;
            g2d.drawString(text, textX, textY);

            g2d.setColor(np.isRed ? new Color(255, 100, 100) : new Color(150, 150, 150));
            g2d.setFont(new Font("Segoe UI", Font.PLAIN, 9));
            String colorLabel = np.isRed ? "R" : "B";
            FontMetrics fmSmall = g2d.getFontMetrics();
            g2d.drawString(colorLabel, x - fmSmall.stringWidth(colorLabel) / 2, y + NODE_RADIUS + 13);

            if (np.nodeValue != null && !np.nodeValue.isEmpty()) {
                String displayVal = truncateValue(np.nodeValue, 11);
                g2d.setColor(new Color(80, 110, 150));
                g2d.setFont(new Font("Segoe UI", Font.PLAIN, 9));
                FontMetrics fmVal = g2d.getFontMetrics();
                g2d.drawString(displayVal, x - fmVal.stringWidth(displayVal) / 2, y + NODE_RADIUS + 25);
            }
        }
    }

    @Override
    public String getToolTipText(MouseEvent event) {
        Map<Integer, NodePosition> positions = calculateTreePositions();
        for (NodePosition np : positions.values()) {
            int nx = (int)(np.x + getWobbleX(np.value));
            int ny = (int)(np.y + getWobbleY(np.value));
            int dx = event.getX() - nx;
            int dy = event.getY() - ny;
            if (Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS) {
                String val = np.nodeValue;
                if (val != null && !val.isEmpty()) {
                    return "<html><b>Key:</b> " + np.value + "<br><b>Value:</b> "
                        + val.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") + "</html>";
                }
                return "Key: " + np.value;
            }
        }
        return null;
    }

    private String truncateValue(String value, int maxLen) {
        if (value == null || value.isEmpty()) return "";
        String display = value;
        if (display.contains("\\") || (display.contains("/") && !display.startsWith("http"))) {
            String[] parts = display.replace('\\', '/').split("/");
            display = parts[parts.length - 1];
        } else if (display.startsWith("http://") || display.startsWith("https://")) {
            display = display.replaceFirst("https?://", "").split("/")[0];
        }
        if (display.length() > maxLen) return display.substring(0, maxLen - 2) + "..";
        return display;
    }

    private static class NodePosition {
        int value, x, y;
        boolean isRed;
        String nodeValue;

        NodePosition(int value, int x, int y, boolean isRed, String nodeValue) {
            this.value = value;
            this.x = x;
            this.y = y;
            this.isRed = isRed;
            this.nodeValue = nodeValue;
        }
    }
}

