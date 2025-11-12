#!/usr/bin/env python3
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import List, Set, Tuple
import hashlib


class RepoSyncer:
    def __init__(self, source_dir: str, target_dir: str):
        self.source_dir = Path(source_dir).resolve()
        self.target_dir = Path(target_dir).resolve()
        self.ignored_patterns = self._load_gitignore_patterns()
        
    def _load_gitignore_patterns(self) -> Set[str]:
        patterns = set()
        
        gitignore_path = self.source_dir / '.gitignore'
        if gitignore_path.exists():
            with open(gitignore_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        patterns.add(line)
        
        common_ignores = {
            'node_modules',
            'dist',
            'build',
            '.next',
            'out',
            '__pycache__',
            '*.pyc',
            '*.pyo',
            '*.pyd',
            '.venv',
            'venv',
            'env',
            'ENV',
            '*.log',
            '.git',
            '.DS_Store',
            'Thumbs.db',
            '*.tsbuildinfo',
            '.env',
            '.env.local',
            'coverage',
            '.nyc_output',
            '.cache',
            '.parcel-cache',
            '*.egg-info',
            '.pytest_cache',
            '.tox',
            '.nox',
            'htmlcov',
            '.coverage',
            'cypress/screenshots',
            'cypress/videos',
            'indicator_monitor.db',
            'exports',
            'scripts',
        }
        patterns.update(common_ignores)
        
        return patterns
    
    def _should_ignore(self, file_path: Path) -> bool:
        try:
            rel_path = file_path.relative_to(self.source_dir)
            path_str = str(rel_path).replace('\\', '/')
        except ValueError:
            return True
        
        parts = path_str.split('/')
        for i in range(len(parts)):
            partial_path = '/'.join(parts[i:])
            if partial_path in self.ignored_patterns:
                return True
            if parts[i] in self.ignored_patterns:
                return True
        
        if file_path.is_file():
            for pattern in self.ignored_patterns:
                if pattern.startswith('*.'):
                    ext = pattern[1:]
                    if file_path.suffix == ext:
                        return True
        
        return False
    
    def _get_file_hash(self, file_path: Path) -> str:
        try:
            with open(file_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception:
            return ''
    
    def _find_all_files(self, directory: Path) -> List[Path]:
        files = []
        for root, dirs, filenames in os.walk(directory):
            dirs[:] = [d for d in dirs if not self._should_ignore(Path(root) / d)]
            
            for filename in filenames:
                file_path = Path(root) / filename
                if not self._should_ignore(file_path):
                    files.append(file_path)
        
        return files
    
    def _get_changed_files(self) -> List[Tuple[Path, Path]]:
        changed_files = []
        
        source_files = self._find_all_files(self.source_dir)
        
        for source_file in source_files:
            rel_path = source_file.relative_to(self.source_dir)
            target_file = self.target_dir / rel_path
            
            if not target_file.exists():
                changed_files.append((source_file, target_file))
                print(f"  [NEW] {rel_path}")
            else:
                source_hash = self._get_file_hash(source_file)
                target_hash = self._get_file_hash(target_file)
                
                if source_hash != target_hash:
                    changed_files.append((source_file, target_file))
                    print(f"  [MODIFIED] {rel_path}")
        
        return changed_files
    
    def _copy_file(self, source: Path, target: Path):
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    
    def sync_files(self) -> bool:
        print(f"\nComparing files between:")
        print(f"   Source: {self.source_dir}")
        print(f"   Target: {self.target_dir}\n")
        
        if not self.source_dir.exists():
            print(f"Error: Source directory does not exist: {self.source_dir}")
            return False
        
        if not self.target_dir.exists():
            print(f"Error: Target directory does not exist: {self.target_dir}")
            return False
        
        changed_files = self._get_changed_files()
        
        if not changed_files:
            print("\nNo files changed. Already in sync!")
            return True
        
        print(f"\nFound {len(changed_files)} file(s) to sync:")
        
        print("\nCopying files...")
        for source, target in changed_files:
            try:
                self._copy_file(source, target)
                print(f"  ✓ Copied: {source.relative_to(self.source_dir)}")
            except Exception as e:
                print(f"  ✗ Error copying {source}: {e}")
                return False
        
        return True
    
    def _run_git_command(self, cmd: List[str], cwd: Path) -> bool:
        try:
            result = subprocess.run(
                cmd,
                cwd=str(cwd),
                capture_output=True,
                text=True,
                check=False
            )
            if result.returncode != 0:
                print(f"Git command failed: {' '.join(cmd)}")
                print(f"   Error: {result.stderr}")
                return False
            return True
        except Exception as e:
            print(f"Error running git command: {e}")
            return False
    
    def commit_and_push(self, branch: str = 'main') -> bool:
        print(f"\nCreating commit and pushing to {branch} branch...")
        
        status_result = subprocess.run(
            ['git', 'status', '--porcelain'],
            cwd=str(self.target_dir),
            capture_output=True,
            text=True
        )
        
        if not status_result.stdout.strip():
            print("No changes to commit.")
            return True
        
        branch_result = subprocess.run(
            ['git', 'branch', '--show-current'],
            cwd=str(self.target_dir),
            capture_output=True,
            text=True
        )
        current_branch = branch_result.stdout.strip()
        
        if current_branch != branch:
            print(f"Switching to {branch} branch...")
            if not self._run_git_command(['git', 'checkout', branch], self.target_dir):
                if not self._run_git_command(['git', 'checkout', '-b', branch], self.target_dir):
                    return False
        
        print("Adding files...")
        if not self._run_git_command(['git', 'add', '.'], self.target_dir):
            return False
        
        print("Creating commit...")
        commit_message = f"chore: sync changes from NFF-Auto-Report\n\nAuto-synced files from NFF-Auto-Report repository"
        if not self._run_git_command(
            ['git', 'commit', '-m', commit_message],
            self.target_dir
        ):
            return False
        
        print(f"Pushing to remote...")
        if not self._run_git_command(['git', 'push', 'origin', branch], self.target_dir):
            return False
        
        print(f"Successfully pushed to {branch} branch!")
        return True


def main():
    script_dir = Path(__file__).parent.resolve()
    source_dir = script_dir.parent
    target_dir = source_dir.parent / 'env-staging'
    
    print("=" * 60)
    print("SYNC SCRIPT: NFF-Auto-Report -> env-staging")
    print("=" * 60)
    
    syncer = RepoSyncer(str(source_dir), str(target_dir))
    
    if not syncer.sync_files():
        print("\nSync failed!")
        sys.exit(1)
    
    if not syncer.commit_and_push('main'):
        print("\nCommit and push failed!")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("SUCCESS! Sync completed.")
    print("=" * 60)


if __name__ == '__main__':
    main()

