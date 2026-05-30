import javax.swing.*;
import javax.swing.filechooser.FileNameExtensionFilter;
import java.awt.*;
import java.awt.geom.RoundRectangle2D;
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
            frame.add(panel);
            frame.setVisible(true);
        });
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
        
        JPanel controlPanel = createControlPanel();
        add(controlPanel, BorderLayout.SOUTH);
    }
    
    private JPanel createControlPanel() {
        JPanel mainPanel = new JPanel();
        mainPanel.setLayout(new BoxLayout(mainPanel, BoxLayout.Y_AXIS));
        mainPanel.setBackground(new Color(245, 247, 250));
        mainPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        
        // Operationen Panel
        JPanel opPanel = createStyledPanel("Baum-Operationen");
        opPanel.add(new JLabel("Wert:"));
        inputField = new JTextField(5);
        inputField.setMaximumSize(new Dimension(60, 30));
        opPanel.add(inputField);
        
        opPanel.add(createStyledButton("Insert", () -> handleInsert()));
        opPanel.add(createStyledButton("Delete", () -> handleDelete()));
        opPanel.add(createStyledButton("Search", () -> handleSearch()));
        opPanel.add(createStyledButton("Min", () -> handleMin()));
        opPanel.add(createStyledButton("Max", () -> handleMax()));
        opPanel.add(createStyledButton("Succ", () -> handleSuccessor()));
        opPanel.add(createStyledButton("Pred", () -> handlePredecessor()));
        
        // Count Panel
        JPanel countPanel = createStyledPanel("Count-Operationen");
        countPanel.add(new JLabel("Wert:"));
        JTextField countField = new JTextField(5);
        countField.setMaximumSize(new Dimension(60, 30));
        countPanel.add(countField);
        
        countPanel.add(createStyledButton("greaterThan", () -> handleGreater(countField.getText())));
        countPanel.add(createStyledButton("lessThan", () -> handleLess(countField.getText())));
        
        // Datei Panel
        JPanel filePanel = createStyledPanel("Dateioperationen");
        filePanel.add(createStyledButton("✚ Neuer Baum", () -> handleNewTree()));
        filePanel.add(createStyledButton("💾 Speichern", () -> handleSave()));
        filePanel.add(createStyledButton("📂 Laden", () -> handleLoad()));
        
        resultLabel = new JLabel("Bereit");
        resultLabel.setFont(new Font("Segoe UI", Font.BOLD, 13));
        resultLabel.setForeground(new Color(40, 120, 200));
        
        mainPanel.add(opPanel);
        mainPanel.add(Box.createVerticalStrut(5));
        mainPanel.add(countPanel);
        mainPanel.add(Box.createVerticalStrut(5));
        mainPanel.add(filePanel);
        mainPanel.add(Box.createVerticalStrut(10));
        mainPanel.add(resultLabel);
        
        return mainPanel;
    }
    
    private JPanel createStyledPanel(String title) {
        JPanel panel = new JPanel();
        panel.setLayout(new FlowLayout(FlowLayout.LEFT, 10, 5));
        panel.setBackground(new Color(255, 255, 255));
        panel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(200, 210, 220), 1),
            BorderFactory.createEmptyBorder(8, 10, 8, 10)
        ));
        
        JLabel label = new JLabel(title);
        label.setFont(new Font("Segoe UI", Font.BOLD, 11));
        label.setForeground(new Color(60, 60, 60));
        panel.add(label);
        panel.add(Box.createHorizontalStrut(10));
        return panel;
    }
    
    private JButton createStyledButton(String text, Runnable action) {
        JButton btn = new JButton(text);
        btn.setPreferredSize(new Dimension(100, 30));
        btn.setFont(new Font("Segoe UI", Font.PLAIN, 11));
        btn.setBackground(new Color(70, 130, 200));
        btn.setForeground(Color.WHITE);
        btn.setBorder(BorderFactory.createEmptyBorder(5, 15, 5, 15));
        btn.setFocusPainted(false);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.addActionListener(e -> action.run());
        return btn;
    }
    
    private void handleInsert() {
        try {
            int val = Integer.parseInt(inputField.getText());
            tree.insert(val, "Value_" + val);
            canvasPanel.clearHighlight();
            canvasPanel.repaint();
            resultLabel.setText("✓ " + val + " eingefügt");
            inputField.setText("");
        } catch (NumberFormatException ex) {
            resultLabel.setText("✗ Ungültige Eingabe");
        }
    }
    
    private void handleDelete() {
        try {
            int val = Integer.parseInt(inputField.getText());
            boolean deleted = tree.delete(val);
            canvasPanel.clearHighlight();
            canvasPanel.repaint();
            resultLabel.setText(deleted ? "✓ " + val + " gelöscht" : "✗ " + val + " nicht gefunden");
            inputField.setText("");
        } catch (NumberFormatException ex) {
            resultLabel.setText("✗ Ungültige Eingabe");
        }
    }
    
    private void handleSearch() {
        try {
            int val = Integer.parseInt(inputField.getText());
            String result = tree.search(val);
            canvasPanel.clearHighlight();
            canvasPanel.highlightNodes(Arrays.asList(val));
            canvasPanel.repaint();
            resultLabel.setText(result != null ? "✓ Gefunden: " + result : "✗ Nicht gefunden");
        } catch (NumberFormatException ex) {
            resultLabel.setText("✗ Ungültige Eingabe");
        }
    }
    
    private void handleMin() {
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
    
    private void handleMax() {
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
    
    private void handleSuccessor() {
        try {
            int val = Integer.parseInt(inputField.getText());
            Integer succ = tree.successor(val);
            canvasPanel.clearHighlight();
            if (succ != null) {
                canvasPanel.highlightNodes(Arrays.asList(succ));
                canvasPanel.repaint();
                resultLabel.setText("Successor von " + val + ": " + succ);
            } else {
                resultLabel.setText("Kein Successor");
            }
        } catch (NumberFormatException ex) {
            resultLabel.setText("✗ Ungültige Eingabe");
        }
    }
    
    private void handlePredecessor() {
        try {
            int val = Integer.parseInt(inputField.getText());
            Integer pred = tree.predecessor(val);
            canvasPanel.clearHighlight();
            if (pred != null) {
                canvasPanel.highlightNodes(Arrays.asList(pred));
                canvasPanel.repaint();
                resultLabel.setText("Predecessor von " + val + ": " + pred);
            } else {
                resultLabel.setText("Kein Predecessor");
            }
        } catch (NumberFormatException ex) {
            resultLabel.setText("✗ Ungültige Eingabe");
        }
    }
    
    private void handleGreater(String text) {
        try {
            int x = Integer.parseInt(text);
            int count = tree.greaterThan(x);
            List<Integer> greaterNodes = tree.getGreaterThan(x);
            canvasPanel.clearHighlight();
            canvasPanel.highlightNodes(greaterNodes);
            canvasPanel.repaint();
            resultLabel.setText("greaterThan(" + x + ") = " + count + " 🟨");
        } catch (NumberFormatException ex) {
            resultLabel.setText("✗ Ungültige Eingabe");
        }
    }
    
    private void handleLess(String text) {
        try {
            int x = Integer.parseInt(text);
            int count = tree.lessThan(x);
            List<Integer> lessNodes = tree.getLessThan(x);
            canvasPanel.clearHighlight();
            canvasPanel.highlightNodes(lessNodes);
            canvasPanel.repaint();
            resultLabel.setText("lessThan(" + x + ") = " + count + " 🟨");
        } catch (NumberFormatException ex) {
            resultLabel.setText("✗ Ungültige Eingabe");
        }
    }
    
    private void handleNewTree() {
        tree = new RBTree<>();
        canvasPanel.setTree(tree);
        canvasPanel.clearHighlight();
        canvasPanel.repaint();
        resultLabel.setText("✓ Neuer leerer Baum erstellt");
    }
    
    private void handleSave() {
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
    
    private void handleLoad() {
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
    private static final int NODE_RADIUS = 30;
    private static final int LEVEL_HEIGHT = 100;
    private static final int MIN_HORIZONTAL_GAP = 80;
    
    public TreeCanvasPanel(RBTree<Integer, String> tree) {
        this.tree = tree;
        this.highlightedNodes = new HashSet<>();
        setBackground(new Color(245, 247, 250));
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
            String msg = "Baum ist leer • Klicke 'Insert' um Werte hinzuzufügen";
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
        int height = getHeight();
        int startX = width / 2;
        int startY = 40;
        
        calculateNodePositions(positions, startX, startY, width / 4);
        return positions;
    }
    
    private void calculateNodePositions(Map<Integer, NodePosition> positions, int x, int y, int offset) {
        List<Integer> inOrder = tree.inorderKeys();
        if (inOrder.isEmpty()) return;
        
        Integer root = tree.getRoot();
        if (root == null) return;
        
        calculatePosition(positions, root, x, y, offset, inOrder);
    }
    
    private void calculatePosition(Map<Integer, NodePosition> positions, Integer key, int x, int y, int offset, List<Integer> inOrder) {
        if (key == null) return;
        
        boolean isRed = tree.isNodeRed(key);
        positions.put(key, new NodePosition(key, x, y, isRed));
        
        Integer left = tree.getLeftChild(key);
        Integer right = tree.getRightChild(key);
        
        if (left != null) {
            calculatePosition(positions, left, x - offset, y + LEVEL_HEIGHT, Math.max(offset / 2, 30), inOrder);
        }
        if (right != null) {
            calculatePosition(positions, right, x + offset, y + LEVEL_HEIGHT, Math.max(offset / 2, 30), inOrder);
        }
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
            
            if (left != null && positions.containsKey(left)) {
                NodePosition child = positions.get(left);
                g2d.drawLine(parent.x, parent.y + NODE_RADIUS, child.x, child.y - NODE_RADIUS);
            }
            if (right != null && positions.containsKey(right)) {
                NodePosition child = positions.get(right);
                g2d.drawLine(parent.x, parent.y + NODE_RADIUS, child.x, child.y - NODE_RADIUS);
            }
        }
    }
    
    private void drawNodes(Graphics2D g2d, Map<Integer, NodePosition> positions) {
        for (NodePosition np : positions.values()) {
            // Gelbe Hervorhebung
            if (highlightedNodes.contains(np.value)) {
                g2d.setColor(new Color(255, 255, 0, 80));
                g2d.fillOval(np.x - NODE_RADIUS - 12, np.y - NODE_RADIUS - 12, 
                            (NODE_RADIUS + 12) * 2, (NODE_RADIUS + 12) * 2);
            }
            
            // Knoten-Kreis mit Schatten
            g2d.setColor(new Color(0, 0, 0, 30));
            g2d.fillOval(np.x - NODE_RADIUS + 3, np.y - NODE_RADIUS + 3, NODE_RADIUS * 2, NODE_RADIUS * 2);
            
            // Hauptknoten
            Color color = np.isRed ? new Color(220, 60, 60) : new Color(50, 50, 50);
            g2d.setColor(color);
            g2d.fillOval(np.x - NODE_RADIUS, np.y - NODE_RADIUS, NODE_RADIUS * 2, NODE_RADIUS * 2);
            
            // Border
            g2d.setColor(np.isRed ? new Color(180, 20, 20) : new Color(20, 20, 20));
            g2d.setStroke(new BasicStroke(2.5f));
            g2d.drawOval(np.x - NODE_RADIUS, np.y - NODE_RADIUS, NODE_RADIUS * 2, NODE_RADIUS * 2);
            
            // Text
            g2d.setColor(Color.WHITE);
            g2d.setFont(new Font("Segoe UI", Font.BOLD, 16));
            String text = String.valueOf(np.value);
            FontMetrics fm = g2d.getFontMetrics();
            int textX = np.x - fm.stringWidth(text) / 2;
            int textY = np.y + fm.getAscent() / 2 - 2;
            g2d.drawString(text, textX, textY);
            
            // Farbe-Label
            g2d.setColor(np.isRed ? new Color(255, 100, 100) : new Color(150, 150, 150));
            g2d.setFont(new Font("Segoe UI", Font.PLAIN, 9));
            String colorLabel = np.isRed ? "R" : "B";
            FontMetrics fmSmall = g2d.getFontMetrics();
            g2d.drawString(colorLabel, np.x - fmSmall.stringWidth(colorLabel) / 2, np.y + NODE_RADIUS + 15);
        }
    }
    
    private static class NodePosition {
        int value, x, y;
        boolean isRed;
        
        NodePosition(int value, int x, int y, boolean isRed) {
            this.value = value;
            this.x = x;
            this.y = y;
            this.isRed = isRed;
        }
    }
}

