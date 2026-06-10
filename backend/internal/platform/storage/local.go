package storage

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type LocalStorage struct {
	root          string
	publicBaseURL string
}

func NewLocal(root string, publicBaseURL string) *LocalStorage {
	return &LocalStorage{root: root, publicBaseURL: strings.TrimRight(publicBaseURL, "/")}
}

func (s *LocalStorage) SaveListingFile(listingID string, file multipart.File, header *multipart.FileHeader) (string, string, error) {
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" {
		ext = ".bin"
	}

	dir := filepath.Join(s.root, "listings", listingID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", "", err
	}

	name := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	fullPath := filepath.Join(dir, name)
	out, err := os.Create(fullPath)
	if err != nil {
		return "", "", err
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		return "", "", err
	}

	objectPath := filepath.ToSlash(filepath.Join("listings", listingID, name))
	return objectPath, s.publicBaseURL + "/media/" + objectPath, nil
}

func (s *LocalStorage) DeletePublicURL(publicURL string) error {
	prefix := s.publicBaseURL + "/media/"
	if !strings.HasPrefix(publicURL, prefix) {
		return nil
	}

	objectPath := strings.TrimPrefix(publicURL, prefix)
	fullPath := filepath.Join(s.root, filepath.FromSlash(objectPath))
	cleanRoot, err := filepath.Abs(s.root)
	if err != nil {
		return err
	}
	cleanTarget, err := filepath.Abs(fullPath)
	if err != nil {
		return err
	}
	if cleanTarget != cleanRoot && !strings.HasPrefix(cleanTarget, cleanRoot+string(os.PathSeparator)) {
		return fmt.Errorf("invalid media path")
	}

	if err := os.Remove(cleanTarget); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}
