import java.util.ArrayList;
import java.util.List;

public class RBTree<K extends Comparable<K>, V> {
    private static final boolean RED = true;
    private static final boolean BLACK = false;

    private final Node nil = new Node(null, null, BLACK);
    private Node root = nil;

    private class Node {
        K key;
        V value;
        boolean color;
        Node left = nil;
        Node right = nil;
        Node parent = nil;

        Node(K key, V value, boolean color) {
            this.key = key;
            this.value = value;
            this.color = color;
        }
    }

    public RBTree() {
        nil.left = nil.right = nil.parent = nil;
    }

    public V search(K key) {
        Node node = searchNode(key);
        return node == nil ? null : node.value;
    }

    private Node searchNode(K key) {
        Node x = root;
        while (x != nil && key.compareTo(x.key) != 0) {
            x = key.compareTo(x.key) < 0 ? x.left : x.right;
        }
        return x;
    }

    public K minimum() {
        Node node = minimum(root);
        return node == nil ? null : node.key;
    }

    public K maximum() {
        Node node = maximum(root);
        return node == nil ? null : node.key;
    }

    private Node minimum(Node x) {
        while (x != nil && x.left != nil) {
            x = x.left;
        }
        return x;
    }

    private Node maximum(Node x) {
        while (x != nil && x.right != nil) {
            x = x.right;
        }
        return x;
    }

    public K successor(K key) {
        Node node = searchNode(key);
        if (node == nil) return null;
        if (node.right != nil) return minimum(node.right).key;
        Node y = node.parent;
        while (y != nil && node == y.right) {
            node = y;
            y = y.parent;
        }
        return y == nil ? null : y.key;
    }

    public K predecessor(K key) {
        Node node = searchNode(key);
        if (node == nil) return null;
        if (node.left != nil) return maximum(node.left).key;
        Node y = node.parent;
        while (y != nil && node == y.left) {
            node = y;
            y = y.parent;
        }
        return y == nil ? null : y.key;
    }

    public void insert(K key, V value) {
        Node z = new Node(key, value, RED);
        Node y = nil;
        Node x = root;
        while (x != nil) {
            y = x;
            int cmp = z.key.compareTo(x.key);
            if (cmp < 0) {
                x = x.left;
            } else if (cmp > 0) {
                x = x.right;
            } else {
                x.value = value;
                return;
            }
        }
        z.parent = y;
        if (y == nil) {
            root = z;
        } else if (z.key.compareTo(y.key) < 0) {
            y.left = z;
        } else {
            y.right = z;
        }
        z.left = nil;
        z.right = nil;
        insertFixup(z);
    }

    private void insertFixup(Node z) {
        while (z.parent.color == RED) {
            if (z.parent == z.parent.parent.left) {
                Node y = z.parent.parent.right;
                if (y.color == RED) {
                    z.parent.color = BLACK;
                    y.color = BLACK;
                    z.parent.parent.color = RED;
                    z = z.parent.parent;
                } else {
                    if (z == z.parent.right) {
                        z = z.parent;
                        leftRotate(z);
                    }
                    z.parent.color = BLACK;
                    z.parent.parent.color = RED;
                    rightRotate(z.parent.parent);
                }
            } else {
                Node y = z.parent.parent.left;
                if (y.color == RED) {
                    z.parent.color = BLACK;
                    y.color = BLACK;
                    z.parent.parent.color = RED;
                    z = z.parent.parent;
                } else {
                    if (z == z.parent.left) {
                        z = z.parent;
                        rightRotate(z);
                    }
                    z.parent.color = BLACK;
                    z.parent.parent.color = RED;
                    leftRotate(z.parent.parent);
                }
            }
        }
        root.color = BLACK;
    }

    private void leftRotate(Node x) {
        Node y = x.right;
        x.right = y.left;
        if (y.left != nil) y.left.parent = x;
        y.parent = x.parent;
        if (x.parent == nil) root = y;
        else if (x == x.parent.left) x.parent.left = y;
        else x.parent.right = y;
        y.left = x;
        x.parent = y;
    }

    private void rightRotate(Node y) {
        Node x = y.left;
        y.left = x.right;
        if (x.right != nil) x.right.parent = y;
        x.parent = y.parent;
        if (y.parent == nil) root = x;
        else if (y == y.parent.right) y.parent.right = x;
        else y.parent.left = x;
        x.right = y;
        y.parent = x;
    }

    public boolean delete(K key) {
        Node z = searchNode(key);
        if (z == nil) return false;
        Node y = z;
        boolean yOriginalColor = y.color;
        Node x;
        if (z.left == nil) {
            x = z.right;
            transplant(z, z.right);
        } else if (z.right == nil) {
            x = z.left;
            transplant(z, z.left);
        } else {
            y = minimum(z.right);
            yOriginalColor = y.color;
            x = y.right;
            if (y.parent == z) {
                x.parent = y;
            } else {
                transplant(y, y.right);
                y.right = z.right;
                y.right.parent = y;
            }
            transplant(z, y);
            y.left = z.left;
            y.left.parent = y;
            y.color = z.color;
        }
        if (yOriginalColor == BLACK) deleteFixup(x);
        return true;
    }

    private void transplant(Node u, Node v) {
        if (u.parent == nil) root = v;
        else if (u == u.parent.left) u.parent.left = v;
        else u.parent.right = v;
        v.parent = u.parent;
    }

    private void deleteFixup(Node x) {
        while (x != root && x.color == BLACK) {
            if (x == x.parent.left) {
                Node w = x.parent.right;
                if (w.color == RED) {
                    w.color = BLACK;
                    x.parent.color = RED;
                    leftRotate(x.parent);
                    w = x.parent.right;
                }
                if (w.left.color == BLACK && w.right.color == BLACK) {
                    w.color = RED;
                    x = x.parent;
                } else {
                    if (w.right.color == BLACK) {
                        w.left.color = BLACK;
                        w.color = RED;
                        rightRotate(w);
                        w = x.parent.right;
                    }
                    w.color = x.parent.color;
                    x.parent.color = BLACK;
                    w.right.color = BLACK;
                    leftRotate(x.parent);
                    x = root;
                }
            } else {
                Node w = x.parent.left;
                if (w.color == RED) {
                    w.color = BLACK;
                    x.parent.color = RED;
                    rightRotate(x.parent);
                    w = x.parent.left;
                }
                if (w.right.color == BLACK && w.left.color == BLACK) {
                    w.color = RED;
                    x = x.parent;
                } else {
                    if (w.left.color == BLACK) {
                        w.right.color = BLACK;
                        w.color = RED;
                        leftRotate(w);
                        w = x.parent.left;
                    }
                    w.color = x.parent.color;
                    x.parent.color = BLACK;
                    w.left.color = BLACK;
                    rightRotate(x.parent);
                    x = root;
                }
            }
        }
        x.color = BLACK;
    }

    public List<K> inorderKeys() {
        List<K> keys = new ArrayList<>();
        inorder(root, keys);
        return keys;
    }

    private void inorder(Node node, List<K> keys) {
        if (node == nil) return;
        inorder(node.left, keys);
        keys.add(node.key);
        inorder(node.right, keys);
    }

    public static void main(String[] args) {
        RBTree<Integer, String> tree = new RBTree<>();
        for (int key : new int[]{41, 38, 31, 12, 19, 8}) {
            tree.insert(key, "Ereignis " + key);
        }
        System.out.println(tree.inorderKeys());
        System.out.println(tree.search(19));
        tree.delete(12);
        System.out.println(tree.inorderKeys());
    }
}
